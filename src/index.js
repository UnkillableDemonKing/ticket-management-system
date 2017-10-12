import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.css';
import registerServiceWorker from './registerServiceWorker';
import firebase from 'firebase';
import {BrowserRouter} from "react-router-dom";

var config = {
    apiKey: "AIzaSyBoZ1gydSwOYTLEbZ5lx-YJlKGKUUkJBLM",
    authDomain: "node-its-system.firebaseapp.com",
    databaseURL: "https://node-its-system.firebaseio.com",
    projectId: "node-its-system",
    storageBucket: "node-its-system.appspot.com",
    messagingSenderId: "585030439796"
  };
firebase.initializeApp(config);


ReactDOM.render(
    <BrowserRouter>
        <App />
    </BrowserRouter>
, document.getElementById('root'));
registerServiceWorker();