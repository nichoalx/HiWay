import cv2
import numpy as np
from tqdm import tqdm
import supervision as sv
from ultralytics import YOLO
from collections import defaultdict, deque

# Load YOLO model
MODEL_NAME = "yolov8n.pt"
model = YOLO(MODEL_NAME)

# Video Source & Target Paths
SOURCE_VIDEO_PATH = "SampleVideos/Sample1.mp4"
TARGET_VIDEO_PATH = "output.mp4"
DURATION = 5

# Configuration
CONFIDENCE_THRESHOLD = 0.3
IOU_THRESHOLD = 0.7
MODEL_RESOLUTION = 640

# Define Region of Interest (ROI) for Speed Calculation
SOURCE = np.array([
    [250, 125],  # Top left (aligns with left green dot)
    [375, 125],  # Top right (aligns with right green dot)
    [605, 205],  # Bottom right (follows road perspective)
    [5, 205]    # Bottom left (follows road perspective)
])

# Define transformation target space
TARGET_WIDTH = 30
TARGET_HEIGHT = 250
TARGET = np.array([
    [0, 0],
    [TARGET_WIDTH - 1, 0],
    [TARGET_WIDTH - 1, TARGET_HEIGHT - 1],
    [0, TARGET_HEIGHT - 1]
])

# Perspective transformation
class ViewTransformer:
    def __init__(self, source, target):
        self.m = cv2.getPerspectiveTransform(source.astype(np.float32), target.astype(np.float32))

    def transform_points(self, points):
        if points.size == 0:
            return points
        reshaped_points = points.reshape(-1, 1, 2).astype(np.float32)
        transformed_points = cv2.perspectiveTransform(reshaped_points, self.m)
        return transformed_points.reshape(-1, 2)

view_transformer = ViewTransformer(SOURCE, TARGET)

# Process video
video_info = sv.VideoInfo.from_video_path(video_path=SOURCE_VIDEO_PATH)
frame_generator = sv.get_video_frames_generator(source_path=SOURCE_VIDEO_PATH)

# Tracker setup
byte_track = sv.ByteTrack(frame_rate=video_info.fps)

# Annotators configuration
thickness = sv.calculate_optimal_line_thickness(resolution_wh=video_info.resolution_wh)
text_scale = sv.calculate_optimal_text_scale(resolution_wh=video_info.resolution_wh)
bounding_box_annotator = sv.BoundingBoxAnnotator(thickness=thickness)
label_annotator = sv.LabelAnnotator(text_scale=text_scale, text_thickness=thickness, text_position=sv.Position.BOTTOM_CENTER)
trace_annotator = sv.TraceAnnotator(thickness=thickness, trace_length=video_info.fps * 2, position=sv.Position.BOTTOM_CENTER)

# Zone filtering
polygon_zone = sv.PolygonZone(polygon=SOURCE)

# Store vehicle speed data
coordinates = defaultdict(lambda: deque(maxlen=video_info.fps))

# Draw ROI on the first frame
frame_iterator = iter(frame_generator)
frame = next(frame_iterator)

# Overlay ROI on the first frame
annotated_frame = frame.copy()
annotated_frame = sv.draw_polygon(
    scene=annotated_frame,
    polygon=SOURCE,
    color=sv.Color.RED,  # 
    thickness=4
)

# Display the ROI for verification
sv.plot_image(annotated_frame)

# Open target video
with sv.VideoSink(TARGET_VIDEO_PATH, video_info) as sink:
    max_frames = int(DURATION * video_info.fps) if DURATION else video_info.total_frames  

    for i, frame in enumerate(tqdm(frame_generator, total=video_info.total_frames)):  
        if i >= max_frames:
            break  

        result = model(frame, imgsz=MODEL_RESOLUTION, verbose=False)[0]
        detections = sv.Detections.from_ultralytics(result)

        # Filter detections
        detections = detections[detections.confidence > CONFIDENCE_THRESHOLD]
        detections = detections[polygon_zone.trigger(detections)]
        detections = detections.with_nms(IOU_THRESHOLD)
        detections = byte_track.update_with_detections(detections=detections)

        points = detections.get_anchors_coordinates(anchor=sv.Position.BOTTOM_CENTER)
        points = view_transformer.transform_points(points=points).astype(int)

        # Store and compute speed
        for tracker_id, [_, y] in zip(detections.tracker_id, points):
            coordinates[tracker_id].append(y)

        labels = []
        for tracker_id in detections.tracker_id:
            if len(coordinates[tracker_id]) < video_info.fps / 2:
                labels.append(f"#{tracker_id}")
            else:
                coordinate_start = coordinates[tracker_id][-1]
                coordinate_end = coordinates[tracker_id][0]
                distance = abs(coordinate_start - coordinate_end)
                time = len(coordinates[tracker_id]) / video_info.fps
                speed = distance / time * 3.6
                labels.append(f"#{tracker_id} {int(speed)} km/h")

        # Annotate frame
        annotated_frame = frame.copy()
        annotated_frame = trace_annotator.annotate(scene=annotated_frame, detections=detections)
        annotated_frame = bounding_box_annotator.annotate(scene=annotated_frame, detections=detections)
        annotated_frame = label_annotator.annotate(scene=annotated_frame, detections=detections, labels=labels)

        # Save frame
        sink.write_frame(annotated_frame)
