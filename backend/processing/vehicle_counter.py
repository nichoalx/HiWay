import cv2
import numpy as np
np.float = np.float64  # Fix NumPy deprecation
import torch
import supervision as sv
from ultralytics import YOLO
from yolox.tracker.byte_tracker import BYTETracker
from collections import defaultdict

# Load YOLO model
MODEL = "yolov8n.pt"
model = YOLO(MODEL)
model.fuse()

# Define classes for detection
CLASS_NAMES_DICT = model.model.names
CLASS_IDS = {2, 5, 7}  # Car, Bus, Truck

# ByteTrack settings
class BYTETrackerArgs:
    track_thresh = 0.25
    track_buffer = 30
    match_thresh = 0.8
    mot20 = False

def process_video(input_path, output_path, duration=None):
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        print("Error: Could not open video.")
        return
    
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    if duration:
        total_frames = min(total_frames, int(duration * fps))
    
    out = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*'mp4v'), fps, (width, height))
    tracker = BYTETracker(BYTETrackerArgs())

    # Improved tracking data structures
    track_id_to_class = {}  # Dictionary {track_id: class_id}
    track_class_confidence = {}  # Dictionary {track_id: confidence for the class}
    track_last_seen = {}  # Dictionary {track_id: last frame the track was seen}
    counted_track_ids = set()  # Tracks that have been counted
    
    # Additional parameters for improved tracking
    CLASS_CONFIDENCE_THRESHOLD = 0.8  # Minimum confidence to lock in a class
    MAX_FRAMES_MISSING = fps * 5  # Consider a track gone after 3 seconds, adjust as needed
    current_frame = 0
    
    # Counts vehicles that cross this line
    count_line_y = int(height * 0.5)  # Adjust as necessary (depends on video)
    counted_line_buffer = 50  # Buffer around the counting line in pixels

    # Create annotators
    bounding_box_annotator = sv.BoxAnnotator()
    label_annotator = sv.LabelAnnotator()
    
    
    # Stats for each vehicle class
    class_counts = {2: 0, 5: 0, 7: 0}  # Counts for Car, Bus, Truck
    
    # Draw count line
    def draw_count_area(frame):
        cv2.line(frame, (0, count_line_y), (width, count_line_y), (0, 255, 0), 2)
        cv2.putText(frame, "Count Line", (width - 150, count_line_y - 10), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        return frame

    for _ in range(total_frames):
        ret, frame = cap.read()
        if not ret:
            break
            
        current_frame += 1

        # Run YOLO detection
        results = model(frame)[0]
        detections_xyxy = results.boxes.xyxy.cpu().numpy() if results.boxes.xyxy.numel() > 0 else np.empty((0, 4), dtype=np.float32)
        detections_conf = results.boxes.conf.cpu().numpy() if results.boxes.conf.numel() > 0 else np.empty((0,), dtype=np.float32)
        detections_cls = results.boxes.cls.cpu().numpy().astype(int) if results.boxes.cls.numel() > 0 else np.empty((0,), dtype=int)

        # Filter detections (Only keep vehicles)
        filtered_detections = []
        filtered_classes = []
        
        for box, conf, class_id in zip(detections_xyxy, detections_conf, detections_cls):
            if class_id in CLASS_IDS:
                filtered_detections.append([box[0], box[1], box[2], box[3], conf, class_id])
                filtered_classes.append(class_id)

        filtered_detections = np.array(filtered_detections, dtype=np.float32)

        if filtered_detections.shape[0] > 0:
            # Run the tracker
            tracks = tracker.update(
                filtered_detections, 
                [height, width], 
                [height, width]
            )

            tracked_xyxy = []
            tracked_conf = []
            tracked_ids = []
            tracked_classes = []
            
            # Process each track
            for track in tracks:
                track_id = track.track_id
                bbox = track.tlbr  # top-left, bottom-right format
                confidence = track.score
                
                # Find the detection index for this track
                # Note: This is an approximation as ByteTracker doesn't directly map tracks to detections
                detection_idx = -1
                for i, det in enumerate(filtered_detections):
                    iou = calculate_iou(bbox, det[:4])
                    if iou > 0.5:  # If there's significant overlap
                        detection_idx = i
                        break
                
                # If we found a matching detection
                if detection_idx >= 0:
                    class_id = filtered_classes[detection_idx]
                    
                    # Update class assignment logic
                    if track_id not in track_id_to_class:
                        # New track - assign class
                        track_id_to_class[track_id] = class_id
                        track_class_confidence[track_id] = confidence
                    elif confidence > track_class_confidence[track_id]:
                        # Only update class if we have higher confidence and haven't locked it
                        if track_class_confidence[track_id] < CLASS_CONFIDENCE_THRESHOLD:
                            track_id_to_class[track_id] = class_id
                            track_class_confidence[track_id] = confidence
                    
                    # Record that we've seen this track in this frame
                    track_last_seen[track_id] = current_frame
                    
                    # Check if vehicle crosses count line and hasn't been counted yet
                    center_y = (bbox[1] + bbox[3]) / 2
                    
                    if track_id not in counted_track_ids and \
                       abs(center_y - count_line_y) < counted_line_buffer:
                        counted_track_ids.add(track_id)
                        class_counts[track_id_to_class[track_id]] += 1
                    
                    # Add to tracking lists for annotation
                    tracked_xyxy.append(bbox)
                    tracked_conf.append(confidence)
                    tracked_ids.append(track_id)
                    tracked_classes.append(track_id_to_class[track_id])

            # Create supervision detections for visualization
            if tracked_xyxy:
                tracked_xyxy = np.array(tracked_xyxy, dtype=np.float32)
                tracked_conf = np.array(tracked_conf, dtype=np.float32)
                tracked_ids = np.array(tracked_ids, dtype=int)
                tracked_classes = np.array(tracked_classes, dtype=int)
                
                detections = sv.Detections(
                    xyxy=tracked_xyxy,
                    confidence=tracked_conf,
                    class_id=tracked_classes
                )

                # Generate labels with consistent class names
                labels = [
                    f"{CLASS_NAMES_DICT[class_id]} ID:{track_id} {conf:.2f}"
                    for track_id, class_id, conf in zip(tracked_ids, tracked_classes, tracked_conf)
                ]

                # Draw bounding boxes and labels
                frame = bounding_box_annotator.annotate(frame, detections)
                frame = label_annotator.annotate(frame, detections, labels)

        # Clean up old tracks that haven't been seen recently
        tracks_to_remove = []
        for track_id, last_seen in track_last_seen.items():
            if current_frame - last_seen > MAX_FRAMES_MISSING:
                tracks_to_remove.append(track_id)
                
        for track_id in tracks_to_remove:
            track_last_seen.pop(track_id)
            track_id_to_class.pop(track_id, None)
            track_class_confidence.pop(track_id, None)

        # Draw counting line
        frame = draw_count_area(frame)
            
        # Display total vehicle count with breakdown
        total_count = len(counted_track_ids)
        cv2.putText(frame, f"Total Vehicles: {total_count}", (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        
        # Display class-specific counts
        cv2.putText(frame, f"Cars: {class_counts[2]}", (10, 60), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
        cv2.putText(frame, f"Buses: {class_counts[5]}", (10, 90), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.putText(frame, f"Trucks: {class_counts[7]}", (10, 120), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)

        out.write(frame)
    
    cap.release()
    out.release()
    print(f"Processing completed. Total unique vehicles counted: {total_count}")
    print(f"Cars: {class_counts[2]}, Buses: {class_counts[5]}, Trucks: {class_counts[7]}")

def calculate_iou(box1, box2):
    """
    Calculate Intersection over Union (IoU) between two bounding boxes
    """
    # Determine the coordinates of the intersection rectangle
    x_left = max(box1[0], box2[0])
    y_top = max(box1[1], box2[1])
    x_right = min(box1[2], box2[2])
    y_bottom = min(box1[3], box2[3])

    # If the boxes don't intersect, return 0
    if x_right < x_left or y_bottom < y_top:
        return 0.0

    # Compute the area of intersection
    intersection_area = (x_right - x_left) * (y_bottom - y_top)

    # Compute the area of both bounding boxes
    box1_area = (box1[2] - box1[0]) * (box1[3] - box1[1])
    box2_area = (box2[2] - box2[0]) * (box2[3] - box2[1])

    # Compute the IoU
    iou = intersection_area / float(box1_area + box2_area - intersection_area)
    
    return iou

if __name__ == "__main__":
    input_video = "Sample5.mp4"  # Replace with your input file path
    output_video = "output.mp4"  # Output file path
    duration = 5  # Set to None for full video, or specify seconds
    process_video(input_video, output_video, duration)