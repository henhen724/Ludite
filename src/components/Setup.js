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

import { addUrl, deleteUrl, editUrl } from "../actions/urlActions";
import { editUserEmail, editRefEmail } from "../actions/emailActions";
import { editStartTime, editEndTime } from "../actions/timeActions";

class Setup extends Component {
  dnsChange = id => e => {
    e.preventDefault();
    this.props.editUrl(id, e.target.value, null);
  };
  maxvisitsChange = id => e => {
    e.preventDefault();
    this.props.editUrl(id, null, e.target.value);
  }
  deleteClick = id => () => this.props.deleteUrl(id);
  userChange = e => {
    e.preventDefault();
    this.props.editUserEmail(e.target.value);
  }
  refChange = e => {
    e.preventDefault();
    this.props.editRefEmail(e.target.value);
  }
  startChange = e => {
    e.preventDefault();
    this.props.editStartTime(e.target.value);
  
  }
  endChange = e => {
    e.preventDefault();
    this.props.editEndTime(e.target.value);
  }

  render() {
    return (
      <div>
        <Card>
          <Grid container p={2} spacing={1} alignContent="center">
            <Grid item xs={6}>
              <TextField 
              type="text"
              id="userEmail"
              label="Your Email"
              value={this.props.user_email}
              onChange={this.userChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                type="text"
                id="refEmail"
                label="A Friends Email"
                value={this.props.ref_email}
                onChange={this.refChange}
              />
            </Grid>
          </Grid>
          <Grid container spacing={1} alignContent="center">
            <Grid item xs={6}>
              <TextField type="time" label="Start Time" value={this.props.start_time} onChange={this.startChange}/>
            </Grid>
            <Grid item xs={6}>
              <TextField type="time" label="End Time" value={this.props.end_time} onChange={this.endChange}/>
            </Grid>
          </Grid>
        </Card>
        <Button onClick={this.props.addUrl}>
          <AddCircle />
        </Button>
          <GridList cellHeight={70}>
            {this.props.block_urls.map(aUrl => (
              <GridListTile key={aUrl.id} lg={6}>
                <TextField
                  label='An unproductive site'
                  value={aUrl.dns}
                  onChange={this.dnsChange(aUrl.id)}
                />
                <TextField
                  label='Visit Limit'
                  value={aUrl.maxvisits < 1 ? undefined : aUrl.maxvisits}
                  type='number'
                  onChange={this.maxvisitsChange(aUrl.id)}
                />
                <Button onClick={this.deleteClick(aUrl.id)}>
                  <Delete />
                </Button>
              </GridListTile>
            ))}
          </GridList>
      </div>
    );
  }
}

Setup.propTypes = {
  addUrl: PropTypes.func.isRequired,
  deleteUrl: PropTypes.func.isRequired,
  editUrl: PropTypes.func.isRequired,
  block_urls: PropTypes.array.isRequired,
  editRefEmail: PropTypes.func.isRequired,
  editUserEmail: PropTypes.func.isRequired,
  editStartTime: PropTypes.func.isRequired,
  editEndTime: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    block_urls: state.block_urls,
    user_email: state.user_email,
    ref_email: state.ref_email,
    start_time: state.start_time,
    end_time: state.end_time
  };
};

export default connect(mapStateToProps, { addUrl, deleteUrl, editUrl, editUserEmail, editRefEmail, editStartTime, editEndTime })(Setup);