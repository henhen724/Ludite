import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import {
  Button,
  Table,
  TableCell,
  TableRow,
  Paper,
  TableHead
} from "@material-ui/core";

class Usage extends Component {
  render() {
    return (
      <div>
        <Paper>
          <Table>
            <TableHead>
              {this.props.block_urls.map(url => (
                <TableRow key={url.id}>
                  <TableCell>{url.dns}</TableCell>
                  <TableCell>
                    {url.visits}/{url.maxvisits}
                  </TableCell>
                </TableRow>
              ))}
            </TableHead>
          </Table>
        </Paper>
        <Button>Edit</Button>
        <Button>End</Button>
      </div>
    );
  }
}

Usage.propTypes = {
  block_urls: PropTypes.array.isRequired
};

const mapStateToProps = state => {
  return {
    block_urls: state.block_urls
  };
};

export default connect(mapStateToProps)(Usage);
