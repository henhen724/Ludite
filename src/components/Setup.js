import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import {
  Button,
  TextField,
  Grid,
  GridList,
  GridListTile,
  Checkbox,
  Card
} from "@material-ui/core";
import { AddCircle, Delete } from "@material-ui/icons";
import DateFnsUtils from "@date-io/date-fns";
import {
  MuiPickersUtilsProvider,
  KeyboardTimePicker
} from "@material-ui/pickers";

import { addUrl, deleteUrl, editUrl } from "../actions/urlActions";

class Setup extends Component {
  dnsChange = id => e => {
    this.props.editUrl(id, e.target.value, null);
  };
  maxvisitsChange = id => e => {
    this.props.editUrl(id, null, e.target.value);
  };
  deleteClick = id => () => this.props.deleteUrl(id);

  render() {
    return (
      <div>
        <Card>
          <Grid container p={2} spacing={1} alignContent="center">
            <Grid item xs={6}>
              <TextField placeholder="me@example.com" label="User Email" />
            </Grid>
            <Grid item xs={6}>
              <TextField
                placeholder="myfriend@example.com"
                label="Referee Email"
              />
            </Grid>
          </Grid>
          <Grid container spacing={1} alignContent="center">
            <Grid item xs={6}>
              <Checkbox /> tab killer
            </Grid>
            <Grid item xs={6}>
              <Checkbox />
              weekend
            </Grid>
          </Grid>
        </Card>
        <Button onClick={this.props.addUrl}>
          <AddCircle />
        </Button>
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <GridList cellHeight={70}>
            {this.props.block_urls.map(url => (
              <GridListTile key={url.id} lg={6}>
                <TextField
                  defaultValue={url.dns}
                  onChange={this.dnsChange(url.id)}
                />
                <TextField
                  defaultValue={url.maxvisits}
                  onChange={this.maxvisitsChange(url.id)}
                />
                <br />
                <KeyboardTimePicker />
                <KeyboardTimePicker />
                <Button onClick={this.deleteClick(url.id)}>
                  <Delete />
                </Button>
              </GridListTile>
            ))}
          </GridList>
        </MuiPickersUtilsProvider>
      </div>
    );
  }
}

Setup.propTypes = {
  addUrl: PropTypes.func.isRequired,
  deleteUrl: PropTypes.func.isRequired,
  editUrl: PropTypes.func.isRequired,
  block_urls: PropTypes.array.isRequired
};

const mapStateToProps = state => {
  return {
    block_urls: state.block_urls
  };
};

export default connect(mapStateToProps, { addUrl, deleteUrl, editUrl })(Setup);
