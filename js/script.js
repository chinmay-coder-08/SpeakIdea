// Link to your trained Teachable Machine model
const URL = "./my_model/";
let model, webcam, labelContainer, maxPredictions;
let currentText = '';
let currentCamera = 'front';
// Cleanup previous webcam and stop any active webcam stream
function cleanupWebcam() {
    if (webcam) {
        webcam.stop();
        webcam = null;
    }
    const webcamContainer = document.getElementById("webcam-container");
    webcamContainer.innerHTML = ''; // Clear previous webcam canvas
}
function restartbtn() {
    const textBox = document.getElementById('textBox');
    currentText = "";
    textBox.value = "";
}
// Load the image model and setup the webcam
async function init() {
    const columnsContainer = document.getElementById("columns-container");
    columnsContainer.classList.remove("d-none");
    columnsContainer.style.opacity = 0;
    const start_btn = document.getElementsByClassName("start-recognizing")[0];
    const btnparent = document.getElementsByClassName("btnparent")[0];
    btnparent.innerHTML = ` <button class="start-recognizing" onclick="switchCamera()">Switch Camera</button>`
    setTimeout(() => (columnsContainer.style.opacity = 1), 100);
    cleanupWebcam(); // Clean up any previous webcam instances before starting a new one

    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // Load the model and metadata
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();
    console.log(maxPredictions);
    setupWebcam(currentCamera);
}
async function setupWebcam(cameraType) {
    const flip = (cameraType === 'front'); // Flip the webcam only for the front camera
    webcam = new tmImage.Webcam(500, 350, flip); // width, height, flip
    await webcam.setup({ facingMode: cameraType }); // Use the appropriate camera
    await webcam.play();
    window.requestAnimationFrame(loop);

    // Append webcam to the DOM
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    const canvas = webcam.canvas;
    canvas.classList.add("styled-webcam");
    // Create a container for the labels
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }
}
function switchCamera() {
    currentCamera = (currentCamera === 'front') ? 'environment' : 'front'; // Toggle between 'front' and 'environment'
    cleanupWebcam(); // Clean up the current webcam instance
    setupWebcam(currentCamera); // Set up the new camera
    const btn = document.getElementById("switch-camera-btn");
    btn.innerHTML = (currentCamera === 'front') ? 'Switch to Back Camera' : 'Switch to Front Camera'; // Update button text
}
// Loop to update the webcam and predictions
async function loop() {
    webcam.update(); // Update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
}

let lastDetectedClass = ''; // Variable to track the last detected gesture
let lastDetectedTime = 0;   // Timestamp of the last detection
const MIN_TIME_DIFF = 700;  // Minimum time difference in milliseconds

let lastDetectedTimeout; // To manage the timeout

async function predict() {
    // Predict the gesture from the webcam image
    const prediction = await model.predict(webcam.canvas);

    // Find the class with the highest probability
    let highestProbability = 0;
    let detectedClass = '';
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction = prediction[i].className;
        const probability = prediction[i].probability.toFixed(2);

        // Update the highest probability and corresponding class
        if (probability > highestProbability) {
            highestProbability = probability;
            detectedClass = classPrediction;
        }

        // Display probabilities in the label container
        labelContainer.childNodes[i].innerHTML = `${classPrediction}: ${probability}`;
    }

    // Ignore the "nothing" class if it's detected
    if (detectedClass === 'Nothing' && highestProbability > 0.7) {
        return; // Do nothing when "Nothing" is detected
    }

    const currentTime = Date.now(); // Get the current time in milliseconds

    // Process detected gestures
    let lastDetectedLetter = ""; // Initialize last detected letter
    if (highestProbability > 0.7) { // Adjust the threshold if necessary
        if (detectedClass === 'Space') {
            // Add space only if the previous gesture was not "Space"
            if (lastDetectedClass !== 'Space') {
                currentText += ' ';
                lastDetectedLetter = ' '; // The last detected letter is a space
            }
        } else {
            // Add the detected class only if time difference > 700 ms
            if (lastDetectedClass !== detectedClass || (currentTime - lastDetectedTime) >= MIN_TIME_DIFF) {
                currentText += detectedClass;
                lastDetectedLetter = detectedClass; // Update the last detected letter
                lastDetectedTime = currentTime; // Update the last detected time
            }
        }

        lastDetectedClass = detectedClass; // Update the last detected gesture

        // Update the text box with recognized text
        document.getElementById("textBox").value = currentText;

        // Display the last detected letter
        if (lastDetectedLetter) {
            document.getElementById("lastDetectedLetter").textContent = lastDetectedClass;

            // Clear any previous timeout
            if (lastDetectedTimeout) {
                clearTimeout(lastDetectedTimeout);
            }

            // Set a timeout to clear the displayed letter after 0.7 seconds
            lastDetectedTimeout = setTimeout(() => {
                document.getElementById("lastDetectedLetter").textContent = ''; // Clear the letter
            }, 700); // 700 ms timeout
        }
    }
}


// Function to copy the text from the text box to the clipboard
function copyText() {
    const textBox = document.getElementById("textBox");
    textBox.select(); // Select the text in the text box
    textBox.setSelectionRange(0, 99999); // For mobile devices
    navigator.clipboard.writeText(textBox.value) // Copy the text to the clipboard
        .then(() => {
            if (textBox.value == "") {
                alert("No text is recognised")
            }
            else {
                const btn_copy = document.getElementsByClassName("btn-copy")[0];
                btn_copy.innerHTML = "Copied!";
                console.log(btn_copy)
                setTimeout(() => {
                    btn_copy.innerHTML = "Copy text";
                }, 700);
            }
        })
        .catch(err => {
            alert("Failed to copy text: ");
        });
}

// Function to search the text in the text box on Google
function searchOnGoogle() {
    const textBox = document.getElementById("textBox");
    const query = textBox.value.trim();
    if (query) {
        const googleSearchURL = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        window.open(googleSearchURL, "_blank"); // Open the search in a new tab
    } else {
        alert("Text box is empty. Please enter some text to search.");
    }
}
function clearText() {
    const textBox = document.getElementById("textBox");
    const cleartextparent = document.getElementsByClassName("cleartextparent")[0];
    if (currentText == "") {
        alert("No text to clear!")
    } else {
        currentText = "";
        textBox.value = "";
        cleartextparent.innerHTML = `<button class="btn btn-cleartext function-btn" onclick="clearText()">Text cleared!</button>`
        setTimeout(() => {
            cleartextparent.innerHTML = ` <button class="btn btn-cleartext function-btn" onclick="clearText()">Clear text</button>`
        }, 700);
    }
}
