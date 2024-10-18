import { Component, OnInit } from '@angular/core';
import { Camera, requestCameraPermissions } from '@nativescript/camera';
import { ImageSource, alert } from '@nativescript/core';
import * as tf from '@tensorflow/tfjs';

@Component({
  selector: 'ns-sign-language-recognition',
  templateUrl: './sign-language-recognition.component.html',
  styleUrls: ['./sign-language-recognition.component.css']
})
export class SignLanguageRecognitionComponent implements OnInit {
  public recognizedText: string = '';
  public trainingLabel: string = '';
  private model: tf.Sequential;
  private trainingData: { image: tf.Tensor, label: string }[] = [];

  constructor() {}

  async ngOnInit() {
    await this.requestPermissions();
    await this.initModel();
  }

  async requestPermissions() {
    try {
      await requestCameraPermissions();
      console.log('Camera permission granted');
    } catch (err) {
      console.log('Camera permission denied');
      alert('Camera permission is required for this app to work.');
    }
  }

  async initModel() {
    this.model = tf.sequential({
      layers: [
        tf.layers.flatten({inputShape: [224, 224, 3]}),
        tf.layers.dense({units: 128, activation: 'relu'}),
        tf.layers.dense({units: 64, activation: 'relu'}),
        tf.layers.dense({units: 10, activation: 'softmax'})
      ]
    });

    this.model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
  }

  async captureAndRecognize() {
    try {
      const imageAsset = await Camera.takePicture();
      const imageSource = await ImageSource.fromAsset(imageAsset);
      const tensor = this.imageToTensor(imageSource);
      
      const prediction = this.model.predict(tensor) as tf.Tensor;
      const index = prediction.argMax(1).dataSync()[0];
      this.recognizedText = this.indexToLabel(index);
    } catch (error) {
      console.error('Error capturing image:', error);
      alert('Failed to capture image. Please try again.');
    }
  }

  async captureForTraining() {
    if (!this.trainingLabel) {
      alert('Please enter a label for training.');
      return;
    }

    try {
      const imageAsset = await Camera.takePicture();
      const imageSource = await ImageSource.fromAsset(imageAsset);
      const tensor = this.imageToTensor(imageSource);
      
      this.trainingData.push({ image: tensor, label: this.trainingLabel });
      alert(`Image captured for label: ${this.trainingLabel}`);
    } catch (error) {
      console.error('Error capturing image for training:', error);
      alert('Failed to capture image for training. Please try again.');
    }
  }

  async trainModel() {
    if (this.trainingData.length === 0) {
      alert('No training data available. Please capture some images first.');
      return;
    }

    const xs = tf.concat(this.trainingData.map(d => d.image));
    const ys = tf.oneHot(
      tf.tensor1d(this.trainingData.map(d => this.labelToIndex(d.label)), 'int32'),
      10
    );

    await this.model.fit(xs, ys, {
      epochs: 10,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch}: loss = ${logs.loss}`);
        }
      }
    });

    alert('Model training completed!');
  }

  private imageToTensor(image: ImageSource): tf.Tensor {
    // Convert image to tensor (simplified for this example)
    const imageData = image.toBase64String('jpg');
    const buffer = Buffer.from(imageData, 'base64');
    return tf.node.decodeImage(buffer, 3).resizeBilinear([224, 224]).expandDims(0);
  }

  private labelToIndex(label: string): number {
    // Simplified mapping of labels to indices
    const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    return labels.indexOf(label.toUpperCase());
  }

  private indexToLabel(index: number): string {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    return labels[index] || 'Unknown';
  }
}