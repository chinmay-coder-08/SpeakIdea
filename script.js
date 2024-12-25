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

   // Load the image model and setup the webcam
   async function init() {
       cleanupWebcam(); // Clean up any previous webcam instances before starting a new one

       const modelURL = URL + "model.json";
       const metadataURL = URL + "metadata.json";

       // Load the model and metadata
       model = await tmImage.load(modelURL, metadataURL);
       maxPredictions = model.getTotalClasses();

       // Setup webcam
       const flip = true; // Whether to flip the webcam
       webcam = new tmImage.Webcam(350, 350, flip); // width, height, flip
       await webcam.setup(); // Request access to the webcam
       await webcam.play();
       window.requestAnimationFrame(loop);

       // Append webcam to the DOM
       document.getElementById("webcam-container").appendChild(webcam.canvas);

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