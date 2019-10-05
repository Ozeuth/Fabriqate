import React from 'react';
import {Redirect} from 'react-router-dom';

export const ButtonColor = {
  DOUBLE_ACTIVE: "#404040",
  ACTIVE: "#808080",
  INACTIVE: "#D0D0D0",
};

let styles = {
  beginTab: {
    top: "0px",
    left: "0px",
    position: "absolute",
  },
  beginLabel: {
    textAlign: "center",
    fontSize: "18px",
    display: "block",
  },
  form: {
    top: "70px",
    left: "0px",
    margin: "4px",
    position: "absolute",
  },
  submit: {
    width: "100px",
    margin: "4px",
    borderRadius: "4px",
    border: "1px solid #D0D0D0",
    overflow: "auto",
    backgroundColor: ButtonColor.INACTIVE
  }
};


export default class Begin extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      loginColor: ButtonColor.ACTIVE,
      signUpColor: ButtonColor.INACTIVE,
    };
    this.focusLogin = this.focusLogin.bind(this);
    this.focusSignUp = this.focusSignUp.bind(this);
    this.submit = this.submit.bind(this);
  }

  focusLogin() {
    this.setState({
      loginColor: ButtonColor.ACTIVE,
      signUpColor: ButtonColor.INACTIVE,
    });
    document.getElementById("submit").innerText = "Login";
  }

  focusSignUp() {
    this.setState({
      loginColor: ButtonColor.INACTIVE,
      signUpColor: ButtonColor.ACTIVE,
      redirect: false
    });
    document.getElementById("submit").innerText = "Sign Up";
  }

  submit() {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;
    const submit = document.getElementById("submit").textContent;
    if (submit === "Login") {
      fetch(`/login/?username=${user}`, {
        method: 'get',
      }).then(res => {
        if (res.status === 201) {
          window.alert("There is no account with that username");
        } else if (res.status === 200) {
          res.text().then(found => {
            if (pass !== found) {
              window.alert("The password is incorrect");
            } else {
              window.user = user; // Successful Login
              this.setState({
                redirect: true
              })
            }
          });
        }
      });
    } else if (submit === "Sign Up") {
      // Signing up a new account
      const formData = new FormData();
      formData.append('user', user);
      formData.append('pass', pass);
      fetch('/signUp', {
        method: 'post',
        body: formData
      }).then(res => {
        if (res.status === 201) {
          window.alert("There is already an account with that username");
        } else if (res.status === 200) {
          window.user = user; // Successful SignUp
          this.setState({
            redirect: true
          })
        }
      });
    }
  }

  render() {
    const { redirect } = this.state;
    if (redirect) {
      return <Redirect to='/Home'/>;
    }
    return (
      <div className="Begin">
        <div id="beginTab" style={styles.beginTab}>
          <label className="login" id="loginLabel" onClick={this.focusLogin} style={{
            float: "left",
            width: "100px",
            margin: "4px",
            borderRadius: "4px",
            border: "1px solid #D0D0D0",
            overflow: "auto",
            paddingBottom: "20px",
            backgroundColor: this.state.loginColor
          }}>
            <input type="radio" id="login" defaultValue="login" name="begin" style={{visibility: "hidden"}}/>
            <span style={styles.beginLabel}>Login</span>
          </label>
          <label className="signUp" id="signUpLabel" onClick={this.focusSignUp} style={{
            float: "left",
            width: "100px",
            margin: "4px",
            borderRadius: "4px",
            border: "1px solid #D0D0D0",
            overflow: "auto",
            paddingBottom: "20px",
            backgroundColor: this.state.signUpColor
          }}>
            <input type="radio" id="signUp" defaultValue="signUp" name="begin" style={{visibility: "hidden"}}/>
            <span style={styles.beginLabel}>Sign Up</span>
          </label>
        </div>
        <div style={styles.form}>
          <input type="text" id="username" placeholder="Username" style={{width: "208px"}}/><br/>
          <input type="password" id="password" placeholder="Password" style={{width: "208px"}}/><br/>
          <button id="submit" style={styles.submit} onClick={this.submit}>Login</button>
        </div>
      </div>
    );
  }
}
