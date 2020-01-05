// Importing React and Redux
import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
// Importing styleing
import "../assets/css/App.css";
import { createMuiTheme, makeStyles, ThemeProvider } from "@material-ui/core/styles";
// Import material components
import { Card, Tabs, Tab, Paper } from "@material-ui/core";
// Import other components we've written
import Setup from "./Setup";
import Usage from "./Usage";
// Import "actions" - functions which change the app wide state
import { gotoPage } from "../actions/pageActions";
import { getState } from "../actions/startUpActions";

// Define Style
const useStyle = makeStyles(theme => {
  // Write css
})

const theme = createMuiTheme({
  palette: {
    type: 'dark',
    primary: {
      main: '#78b0a0',
      contrastText: '#78b0a0',
    },
    secondary: {
      light: '#ffe066',
      main: '#ff4400',
      dark: '#574c4f',
      contrastText: '#efdab9',
    },
    text: {
        primary: '#ccb591',
        secondary: '#efdab9',
        info: '#78b0a0',
    },
    info:{
      main: '#574c4f',
    }
  }
});

class App extends Component {
  componentDidMount() {
    this.props.getState();
  }
  tabClicked = pageNum => () => this.props.gotoPage(pageNum);
  render() {
    var currentPage = <h1>PAGE NOT FOUND</h1>;
    switch (this.props.currentPageNum) {
      case 0:
        currentPage = <Setup />;
        break;
      case 1:
        currentPage = <Usage />;
        break;
      default:
        currentPage = <Setup />;
    }
    return (
      <ThemeProvider theme={theme}>
        <Card color='info' style={{ height: '32px', fontSize: 24 }}><b>Ludite</b></Card>
        <Paper style={{height: '45hw'}}>
        <Tabs value={this.props.currentPageNum} centered>
          <Tab label="Setup" onClick={this.tabClicked(0)} id="simiple-tabs-1" />
          <Tab label="Usage" onClick={this.tabClicked(1)} id="simiple-tabs-2" />
        </Tabs>
        {currentPage}
        </Paper>
      </ThemeProvider>
    );
  }
}

App.propTypes = {
  gotoPage: PropTypes.func.isRequired,
  currentPageNum: PropTypes.number.isRequired,
  getState: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    currentPageNum: state.currentPageNum
  };
};

export default connect(mapStateToProps, { gotoPage, getState })(App);