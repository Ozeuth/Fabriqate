import React from 'react';
import {ButtonColor} from "./Begin";
import {Redirect} from 'react-router-dom';

let styles = {
  projectButton: {
    width: "100px",
    margin: "4px",
    borderRadius: "4px",
    border: "1px solid #D0D0D0",
    overflow: "auto",
    backgroundColor: ButtonColor.INACTIVE
  }
};

export default class Home extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      projects: null, // Refers to all user projects
      redirect: window.project
    };
    this.displayProjects = this.displayProjects.bind(this);
    this.newProject = this.newProject.bind(this);
    this.selectProject = this.selectProject.bind(this);
    this.displayProjects();
    window.tempHome = this;
  }

  newProject() {
    const user = window.user;
    const projectName = document.getElementById("newProject").value;
    const formData = new FormData();
    formData.append('user', user);
    formData.append('projectName', projectName);
    fetch('/newProject', {
      method: 'post',
      body: formData
    }).then(res => {
      if (res.status === 201) {
        window.alert("There is already a project with that name");
      } else if (res.status === 200) {
        console.log('Project made: ' + projectName);
        window.project = projectName;
        window.newProject = true;
        this.setState({
          redirect: true
        });
      }
    });
  }

  displayProjects() {
    const user = window.user;
    fetch(`/projects/?username=${user}`, {
      method: 'get',
    }).then(res => {
      if (res.status === 201) {
        // There are no user projects
      } else if (res.status === 200) {
        // Display all user projects
        res.json().then(found => {
          this.setState({
            projects: found
          })
        });
      }
    });
  }

  selectProject(event) {
    window.project = event.target.id;
    window.newProject = false;
    this.setState({
      redirect: true
    });
  }

  render() {
    const { redirect } = this.state;
    if (redirect) {
      return <Redirect to='/Render'/>;
    }
    let projects = [];
    if (this.state.projects) {
      projects = this.state.projects.map(function (projectName) {
        return <input type="button" id={projectName} style={styles.projectButton} value={projectName} onClick={window.tempHome.selectProject}>
        </input>;
      });
    }
    return (
      <div>
        <input type="text" id="newProject" placeholder="Project Name" style={{width: "208px"}}/><br/>
        <button style={styles.projectButton} onClick={this.newProject}>New Project</button><br/>
        {projects}
      </div>
    );
  }
}
