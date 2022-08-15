import { createSignal, Show, mergeProps, createEffect } from "solid-js";
import { createStore } from "solid-js/store";
import * as Plot from "@observablehq/plot";
import { timeFormat, isoParse } from "d3-time-format";
import { createGraphQLClient, gql, request } from "@solid-primitives/graphql";
import {
  Card,
  Form,
  Button,
  ButtonGroup,
  Container,
  DropdownButton,
  Dropdown,
  Row,
  Col,
  Table,
  Nav,
  Navbar,
  NavDropdown,
} from "solid-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import * as Aq from "arquero";
import YAML from "yaml";
import Jsonata from "jsonata";
import * as R from "ramda";

let jdata = {
  example: [{ value: 4 }, { value: 7 }, { value: 13 }],
};

let expression = Jsonata("(Disease.newCases)[[0..20]]");
//let reslt = expression.evaluate(jdata);

//console.log(reslt);

const format = timeFormat("%y-%m-%d");
const formatDate = (date) => format(isoParse(date));
const [dataLink, setDataLink] = createStore({});

const PlotLine = (props) => {
  const lprops = mergeProps(props);

  return (
    <div>
      {Plot.plot({
        marginLeft: 120,
        y: {
          grid: true,
        },
        marks: [
          Plot.line(lprops.info, {
            x: (d) => formatDate(d.date),
            y: "newCases",
            stroke: lprops.color,
          }),
        ],
      })}
    </div>
  );
};

const PlotBar = (props) => {
  const bprops = mergeProps(props);

  return (
    <div>
      {Plot.plot({
        marginLeft: 120,
        marks: [
          Plot.ruleY([0]),
          Plot.barY(bprops.info, {
            x: (d) => formatDate(d.date),
            y: "newCases",
            fill: bprops.color,
          }),
        ],
      })}
    </div>
  );
};

const items = {
  bar: PlotBar,
  line: PlotLine,
};

const PlotController = (props) => {
  const client = createGraphQLClient("http://localhost:8080/v1/graphql");

  const [sortDirection, setSortDirection] = createSignal();
  const [action, setAction] = createSignal();
  const [selected, setSelected] = createSignal("bar");
  const [fillcolor, setFillcolor] = createSignal("steelblue");
  const newProps = mergeProps(props);
  setAction(newProps.action);
  setSortDirection(newProps.setSortDirection);

  setDataLink(
    R.fromPairs([
      [
        `${newProps.tag}`,
        {
          keyID: `ID-${newProps.tag}`,
          query: newProps.query,
          sort: newProps.sortDirection,
          where: newProps.action,
          filter: "(Disease.newCases)[[0..20]]",
          dataNode: {},
        },
      ],
    ])
  );

  const [gdata] = client(dataLink[newProps.tag].query, () => ({
    sortDirection: sortDirection(),
    action: dataLink[newProps.tag].where,
    //action: action(),
  }));

  //let fc;

  //setDataLink( l =>  [ ...l , { name: `${newProps.tag}` , dataNode: gdata()["Disease"] }   ]  );
  //const dataLink$ = from(observable(gdata));

  const fcf = (e) => {
    e.preventDefault();
    let ftx = document.getElementById(`fc${newProps.tag}`);
    setFillcolor(ftx.value);
  };

  let qt;
  const fn = (event) => {
    event.preventDefault();
    let vtx = document.getElementById(`tx${newProps.tag}`);
    setDataLink(`${newProps.tag}`, { where: YAML.parse(vtx.value) });
    //setAction(YAML.parse(vtx.value));
  };

  //    id={`fc${newProps.tag}`}

  /*
  setDataLink( R.fromPairs([[`${newProps.tag}`, {dataNode: gdata()["Disease"]  }   ]])  );
  setDataLink( R.fromPairs([[`${newProps.tag}`, { query: newProps.query }   ]])  );
  console.log(dataLink[newProps.tag]);
setDataLink(
              R.fromPairs([[`${newProps.tag}`, gdata()["Disease"]]])

*/
  //console.log(dataLink[newProps.tag]);

  return (
    <Card>
      <Card.Header>
        <Navbar bg="light" expand="lg">
          <Container>
            <Navbar.Brand href="#home">PlotQL: {newProps.tag}</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav class="me-auto">
                <ButtonGroup>
                  <Button variant="secondary">1</Button>
                  <Button variant="secondary">2</Button>

                  <DropdownButton
                    variant="secondary"
                    as={ButtonGroup}
                    title="Dropdown"
                    id="bg-nested-dropdown"
                  >
                    <Dropdown.Item eventKey="1">Dropdown link</Dropdown.Item>
                    <Dropdown.Item eventKey="2">Dropdown link</Dropdown.Item>
                  </DropdownButton>
                </ButtonGroup>
                <NavDropdown title="Dropdown" id="basic-nav-dropdown">
                  <NavDropdown.Item href="#action/3.1">
                    DataGrid
                  </NavDropdown.Item>
                  <NavDropdown.Item href="#action/3.2">
                    Another action
                  </NavDropdown.Item>
                  <NavDropdown.Item href="#action/3.3">
                    Something
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item href="#action/3.4">
                    Separated link
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </Card.Header>
      <Card.Body>
        <div>
          <Form onSubmit={fn}>
            <Form.Group class="sm-3" controlId="plotform.ControlInput1">
              <Form.Label>Enter Hasura Query</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                id={`tx${newProps.tag}`}
              ></Form.Control>

              <Button variant="secondary" type="submit">
                query
              </Button>
            </Form.Group>
          </Form>

          <Form onSubmit={fcf}>
            <Form.Group class="sm-3" controlId="PlotForm.ColorControl1">
              <br />
              <Form.Control size="sm" type="text" id={`fc${newProps.tag}`} />

              <Button variant="primary" type="submit">
                New Color
              </Button>
            </Form.Group>
            <br />
          </Form>

          <Show when={gdata()} fallback={<div>Loading...</div>}>
            {setDataLink(`${newProps.tag}`, { dataNode: gdata()["Disease"] })}
            <div>
              <p>{console.log("dataLink[newProps.tag]")}</p>
            </div>
            <Dynamic
              component={newProps.chart}
              info={gdata()["Disease"]}
              tag={newProps.tag}
              color={fillcolor()}
            />
          </Show>
        </div>
      </Card.Body>
    </Card>
  );

  //<div id={newProps.tag}></div>
};

/*
<Form.Select
                value={selected()}
                onInput={(e) => setSelected(e.currentTarget.value)}
              >
                <For each={Object.keys(items)}>
                  {(fnc) => <option value={fnc}>{fnc}</option>}
                </For>
              </Form.Select>

*/

const DesignGrid = (props) => {
  const designProps = mergeProps(props);

  const dgn = (event) => {
    event.preventDefault();
    let dgx = document.getElementById(`dgx${designProps.tag}`);
    setDataLink(`${designProps.tag}`, { where: YAML.parse(dgx.value) });
    //setAction(YAML.parse(vtx.value));
  };

  return (
    <Card>
      <Card.Header>
        <Nav variant="tabs" defaultActiveKey="#first">
          <Nav.Item>
            <Nav.Link href="#first">Active</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link href="#link">Link</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link href="#disabled" disabled>
              Disabled
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </Card.Header>
      <Card.Body>
        <Card.Title>Design Grid {designProps.tag}</Card.Title>
        <div>
          <Form onSubmit={dgn}>
            <Form.Group class="sm-3" controlId="plotdesignform.ControlInput1">
              <Form.Label>Enter Hasura Query</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                id={`dgx${designProps.tag}`}
              ></Form.Control>

              <Button variant="secondary" type="submit">
                query
              </Button>
            </Form.Group>
          </Form>
        </div>
        <Button variant="primary">Filter</Button>
      </Card.Body>
    </Card>
  );
};

const DataGrid = (props) => {
  //let rslt = from(dataLink$);
  //console.log(rslt);
  const dprops = mergeProps(props);
  //const pred = R.whereAny({name: R.equals(`${dprops.tag}`), dataNode: R.equals(R.__)});
  //if (R.find(pred,dataLink) != undefined)
  //const dl = R.filter(pred, dataLink)[0].dataNode;
  //console.log( R.filter(pred, dataLink)[0].dataNode );
  //const tbl = Aq.from(dprops.info);
  // if (dataLink != undefined)
  //console.log(dataLink[dprops.tag]);
  console.log(dataLink);

  return (
    <div style={"max-height: 300px;overflow-y: scroll;"}>
      <Table
        striped
        bordered
        hover
        size="sm"
        innerHTML={Aq.from(
          dataLink[dprops.tag] == undefined ? {} : dataLink[dprops.tag].dataNode
        ).toHTML()}
      ></Table>
    </div>
  );
};

function App() {
  //let pDiv;

  return (
    <Container>
      <Row>
        <Col>
          <Row>
            <Row>
              <DesignGrid tag={"ivs"} />
            </Row>
            <Row>
              <DataGrid tag={"ivs"} />
            </Row>
          </Row>
          <Row>
            <Row>
              <DesignGrid tag={"vis"} />
            </Row>
            <Row>
              <DataGrid tag={"vis"} />
            </Row>
          </Row>
        </Col>
        <Col>
          <Row>
            <PlotController
              chart={PlotLine}
              tag={"ivs"}
              action={{ newCases: { _gte: 300000 } }}
              sortDirection={{ date: "asc" }}
              query={gql`
                query (
                  $sortDirection: [Disease_order_by!]
                  $action: Disease_bool_exp
                ) {
                  Disease(order_by: $sortDirection, where: $action) {
                    date
                    newCases
                  }
                }
              `}
            />
          </Row>
          <Row>
            <PlotController
              chart={PlotBar}
              tag={"vis"}
              action={{ newCases: { _gte: 0 } }}
              sortDirection={{ date: "asc" }}
              query={gql`
                query (
                  $sortDirection: [Disease_order_by!]
                  $action: Disease_bool_exp
                ) {
                  Disease(order_by: $sortDirection, where: $action) {
                    date
                    newCases
                  }
                }
              `}
            />
          </Row>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
