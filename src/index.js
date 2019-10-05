import React from 'react';
import ReactDOM from 'react-dom';
import {Route, BrowserRouter} from 'react-router-dom';
import './index.css';
import Begin from './Begin';
import Home from './Home';
import Render from './Render';
import * as serviceWorker from './serviceWorker';

/* List of all global windows:
  user: current user
  project: current project
  newProject: is project new
  scene: scene of render
  rendFunc: function to add object to render

  // Change these when you add/ remove objects from the render
  objects: map of object name to array of object meshes

  tempHome: purely for code purposes, deleted
*/

const routing = (
<BrowserRouter>
  <div>
    <Route path="/" component={Begin}/>
    <Route path="/Home" component={Home}/>
    <Route path="/Render" component={Render}/>
  </div>
</BrowserRouter>
);

ReactDOM.render(routing, document.getElementById('root'));

serviceWorker.unregister();
