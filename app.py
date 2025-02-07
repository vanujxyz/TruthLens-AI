import cv2
import keras
import numpy as np
from tensorflow.keras.applications.xception import Xception, preprocess_input
from tensorflow.keras.preprocessing import image
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model
from flask import Flask, request, jsonify

# Initialize Flask app
app = Flask(__name__)

# Load the pre-trained Xception model (exclude top layers)
base_model = Xception(weights='imagenet', include_top=False, pooling='avg')

# Add custom top layer for binary classification (fake vs. real)
x = base_model.output
x = Dense(1, activation='sigmoid')(x)  # Binary classification (fake or real)
model = Model(inputs=base_model.input, outputs=x)

# Compile the model (you can modify the optimizer and loss function if needed)
model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

# Function to preprocess the image before passing to the model
def preprocess_image(img_path):
    # Load the image using OpenCV
    img = cv2.imread(img_path)
    
    # Resize the image to 299x299 (required by Xception)
    img_resized = cv2.resize(img, (299, 299))
    
    # Convert the image from BGR (OpenCV) to RGB (required for Xception)
    img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
    
    # Convert image to array
    img_array = image.img_to_array(img_rgb)
    
    # Add batch dimension (for model input) and preprocess image
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)
    
    return img_array

# Function to detect if the image is fake or real using the Xception model
def detect_fake_image(image_path):
    # Preprocess the image
    img_array = preprocess_image(image_path)

    # Make predictions using the pre-loaded model
    predictions = model.predict(img_array)

    # Define threshold for fake detection (you can adjust based on your model's behavior)
    fake_threshold = 0.5

    # Ensure predictions is a scalar value (binary classification output)
    if predictions.shape == (1, 1):  # If the prediction is a scalar (binary classification)
        result = "Fake Image" if predictions[0][0] < fake_threshold else "Real Image"
    else:
        result = "Error in prediction shape"

    return result

# Flask route for the home page (optional)
@app.route('/')
def home():
    return "Welcome to TruthCheck! Use the /analyze-image endpoint to analyze images."

# Flask route for analyzing images (POST request)
@app.route('/analyze-image', methods=['POST'])
def analyze_image():
    # Get the uploaded image file from the POST request
    print("image received")
    file = request.files['file']
    
    # Save the image temporarily to the local disk
    file_path = "temp_image.jpg"
    file.save(file_path)
    
    # Call the fake image detection function
    result = detect_fake_image(file_path)
    
    # Return the result as a JSON response
    return jsonify({"result": result})

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)

