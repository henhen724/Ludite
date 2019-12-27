import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import "../assets/css/App.css";
import Setup from "./Setup";
import Usage from "./Usage";
import { Card, Tabs, Tab, Paper } from "@material-ui/core";
import { gotoPage } from "../actions/pageActions";
import { getState } from "../actions/startUpActions";

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
      <Paper className="App" style={{ backgroundColor: "#09d3ac" }}>
        <Card style={{ backgroundColor: "#00e6e6" }}>Ludite</Card>
        <Tabs value={this.props.currentPageNum} centered>
          <Tab label="Setup" onClick={this.tabClicked(0)} id="simiple-tabs-1" />
          <Tab label="Usage" onClick={this.tabClicked(1)} id="simiple-tabs-2" />
          <Tab label="Edit" onClick={this.tabClicked(2)} id="simiple-tabs-3" />
        </Tabs>
        {currentPage}
      </Paper>
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

export default connect(mapStateToProps, { gotoPage, getState })(App); //connect(mapStateToProps, { gotoPage })(App);
