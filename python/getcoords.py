# This script is used to get the coordinates of the points on the video frame.
# The video is played and the user can click on the points to get the coordinates of the points.
import cv2

def get_points(event, x, y, flags, param):
    if event == cv2.EVENT_LBUTTONDOWN:
        print(f"Point: ({x}, {y})")

cap = cv2.VideoCapture("SampleVideos/Sample1q.mp4")
cv2.namedWindow("Frame")
cv2.setMouseCallback("Frame", get_points)

while True:
    ret, frame = cap.read()
    if not ret:
        break
    cv2.imshow("Frame", frame)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
