import React from "react";
import { Typography, Avatar } from "@material-ui/core";
import { Droppable } from "react-drag-and-drop";
import { Row, Col, Tag } from "antd";
import { lightGreen, grey } from "@material-ui/core/colors";
import Operations from "./Operations";

export default class Visualize extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTables: {}
    };
  }

  render() {
    const { selectedElements = {}, tables = [], showTable } = this.props;
    const { selectedTables = {} } = this.state;
    const iconHeight = { height: 100, width: 100 };

    if (!tables.length) {
      return null;
    }

    const firstTable = selectedTables[1];
    const secondTable = selectedTables[2];

    const {
      [firstTable]: firstTableKeys = [],
      [secondTable]: secondTableKeys = []
    } = selectedElements;

    return (
      <div>
        <Row style={{ height: 250 }}>
          <Col span={12}>
            <Row>
              <Droppable
                types={["table"]}
                onDrop={({ table }) =>
                  this.setState({
                    selectedTables: { ...selectedTables, 1: table }
                  })
                }
              >
                <Avatar
                  style={{
                    ...iconHeight,
                    backgroundColor: firstTable ? lightGreen[500] : grey,
                    color: "#fff"
                  }}
                >
                  {firstTable || "Table 1"}
                </Avatar>
              </Droppable>
            </Row>
            <Row>
              {firstTable ? (
                <div style={{ marginTop: 10 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Keys:
                  </Typography>
                  {firstTableKeys.length
                    ? firstTableKeys.map(key => <Tag>{key}</Tag>)
                    : "-"}
                </div>
              ) : null}
            </Row>
          </Col>
          <Col span={12}>
            <Droppable
              types={["table"]}
              onDrop={({ table }) =>
                this.setState({
                  selectedTables: { ...selectedTables, 2: table }
                })
              }
            >
              <Avatar
                style={{
                  ...iconHeight,
                  backgroundColor: secondTable ? lightGreen[500] : grey,
                  color: "#fff"
                }}
              >
                {secondTable || "Table 2"}
              </Avatar>
            </Droppable>
            {secondTable ? (
              <div style={{ marginTop: 10 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Keys
                </Typography>
                {secondTableKeys.length
                  ? secondTableKeys.map(key => <Tag>{key}</Tag>)
                  : "-"}
              </div>
            ) : null}
          </Col>
        </Row>

        {firstTable &&
          secondTable &&
          Object.keys(selectedElements).length > 1 && (
            <Operations
              selectedElements={selectedElements}
              selectedTables={selectedTables}
              showTable={showTable}
            />
          )}
      </div>
    );
  }
}
