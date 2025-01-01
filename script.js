// Link to your trained Teachable Machine model
const URL = "https://teachablemachine.withgoogle.com/models/xT_po0b7g/";

let model, webcam, labelContainer, maxPredictions;
let currentText = '';

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
    console.log(textBox);
    textBox.append = "";
}
// Load the image model and setup the webcam
async function init() {
    const columnsContainer = document.getElementById("columns-container");
    columnsContainer.classList.remove("d-none");
    columnsContainer.style.opacity = 0;
    const start_btn = document.getElementsByClassName("start-btn")[0];
    const btnparent = document.getElementsByClassName("btnparent")[0];
    btnparent.innerHTML = `   <button class="start-btn button-85" onclick="restartbtn()">Restart</button>`
    setTimeout(() => (columnsContainer.style.opacity = 1), 100);
    cleanupWebcam(); // Clean up any previous webcam instances before starting a new one

    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // Load the model and metadata
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Setup webcam
    const flip = true; // Whether to flip the webcam
    webcam = new tmImage.Webcam(500, 350, flip); // width, height, flip
    await webcam.setup(); // Request access to the webcam
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

// Loop to update the webcam and predictions
async function loop() {
    webcam.update(); // Update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
}

// Run the webcam image through the model
async function predict() {
    // Predict the gesture from the webcam image
    const prediction = await model.predict(webcam.canvas);

    // Process each class prediction
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction = prediction[i].className;
        const probability = prediction[i].probability.toFixed(2);
        labelContainer.childNodes[i].innerHTML = `${classPrediction}: ${probability}`;

        // If a gesture is detected with a high probability, append to the output text
        if (probability > 0.7) { // Adjust threshold if needed
            if (classPrediction === 'Space') {
                currentText += ' ';
            } else {
                currentText += classPrediction;
            }

            // Update the text box with the current recognized text
            document.getElementById("textBox").value = currentText;
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
            const btn_copy = document.getElementsByClassName("btn-copy")[0];
            btn_copy.innerHTML = "Copied!";
            console.log(btn_copy)
            setTimeout(() => {
                btn_copy.innerHTML = "Copy text";
            }, 700);
        })
        .catch(err => {
            alert("Failed to copy text: " + err);
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
function searchOnWikipedia() {
    const textBox = document.getElementById("textBox");
    const query = textBox.value.trim();
    if (query) {
        const wikipediaSearchURL = `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`;
        window.open(wikipediaSearchURL, "_blank"); // Open the search in a new tab
    } else {
        alert("Text box is empty. Please enter some text to search.");
    }
}
