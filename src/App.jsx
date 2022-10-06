import {
  createSignal,
  Show,
  mergeProps,
  createMemo,
  createUniqueId,
} from "solid-js";
import { createStore, produce } from "solid-js/store";

import * as Plot from "@observablehq/plot";
import { timeFormat, isoParse } from "d3-time-format";
import { createGraphQLClient, gql, request } from "@solid-primitives/graphql";
import { createEventHub, createEventBus } from "@solid-primitives/event-bus";
import {
  HopeProvider,
  Box,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Heading,
  InputGroup,
  InputLeftAddon,
  VStack,
  Select,
  SelectTrigger,
  SelectPlaceholder,
  SelectValue,
  SelectTag,
  SelectTagCloseButton,
  SelectIcon,
  SelectContent,
  SelectListbox,
  SelectOptGroup,
  SelectLabel,
  SelectOption,
  SelectOptionText,
  SelectOptionIndicator,
} from "@hope-ui/solid";

//import * as Aq from "arquero";
import YAML from "yaml";
import Jsonata from "jsonata";
import { JSONPath } from "jsonpath-plus";
import * as R from "ramda";

let expression = Jsonata("(Sales.SALES)[[0..20]]");

/*
  const data = {};

  const eventStorageAPI = {
    bus: createEventBus({value: "red"}),
    clear: () => {
      data = {};
    },
    key: (index) => Object.keys(data)[index],
    get length(){
      return Object.keys(data).length;
    }
  
  
  };

  const [channels, setChannels, {remove, clear}] = createStorage({api: eventStorageAPI});
  const ls = e => console.log(e);
  setChannels('busA', 1);
  console.log(channels.bus)
  //channels.bus.listen(ls);
  //channels.bus.emit("hi");
  */

//let reslt = expression.evaluate(jdata);

//const [channels, setChannels] = createStorage({api: eventStorageAPI});

const [channels, setChannels] = createStore({});

const format = timeFormat("%y-%m-%d");
const formatDate = (date) => format(isoParse(date));
const [dataLink, setDataLink] = createStore({});

const inst = { task: "addBus"};

const dispatcher = (actions) => {
  switch (actions.task) {
    case "addBus":
      setChannels(
        produce((s) => {
          s[actions.name] = actions.data;
        }));
        break;
    case "addCache":
      setChannels(
        produce((s) => {
          s.cache[actions.name] = actions.data;
        }));
        break;
      
  }
};

setChannels(
  produce((s) => {
    s.bus = createEventBus({
      value: { task: "addbus",  name: "colorA", data: "red"  },
    });
    s.dispatch = (x) => dispatcher(x);
    s.cache = {};
  })
);



const ls = (e) => channels.dispatch(e);
channels.bus.listen(ls);
console.log("log: " + channels.bus.value());
//channels.bus.emit("hi");
//console.log("log: " + channels.bus.value());
channels.bus.emit({ task: "addBus" , name: "colorB", data: "blue" } );
//channels.dispatch;
console.log(channels);
channels.bus.emit({ task: "addBus" , name: "colorA", data: "red" } );
console.log(channels);
channels.bus.emit({ task: "addBus" , name: "colorA", data: "yellow" } );
console.log(channels);
channels.bus.emit({ task: "addCache" , name: "salesA", data: [ {x: 1, y: 1}, {x: 2, y: 2}] } );
console.log(channels);

const channel = createEventHub({
  colorA: createEventBus({ value: "steelblue" }),
  colorB: createEventBus({ value: "yellow" }),
});

const ColorLine = (props) => {
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
            x: (d) => formatDate(d.ORDERDATE),
            y: "SALES",
            stroke: lprops.color,
          }),
        ],
      })}
    </div>
  );
};

const ColorEventLine = (props) => {
  const colorEventLineProps = mergeProps(props);

  return (
    <div>
      {Plot.plot({
        marginLeft: 120,
        y: {
          grid: true,
        },
        marks: [
          Plot.line(colorEventLineProps.info, {
            x: (d) => formatDate(d.ORDERDATE),
            y: "SALES",
            stroke: channel[colorEventLineProps.bus.color].value(),
          }),
        ],
      })}
    </div>
  );
};

const ColorBar = (props) => {
  const bprops = mergeProps(props);

  return (
    <div>
      {Plot.plot({
        marginLeft: 120,
        marks: [
          Plot.ruleY([0]),
          Plot.barY(bprops.info, {
            x: (d) => formatDate(d.ORDERDATE),
            y: "SALES",
            fill: bprops.color,
          }),
        ],
      })}
    </div>
  );
};

const ColorEventBar = (props) => {
  const colorEventBarProps = mergeProps(props);

  return (
    <div>
      {Plot.plot({
        marginLeft: 120,
        marks: [
          Plot.ruleY([0]),
          Plot.barY(colorEventBarProps.info, {
            x: (d) => formatDate(d.ORDERDATE),
            y: "SALES",
            fill: channel[colorEventBarProps.bus.color].value(),
          }),
        ],
      })}
    </div>
  );
};

const ColorEventMenuView = (props) => {
  const colorEventMenuViewProps = mergeProps(props);

  channel.on(colorEventMenuViewProps.bus.color, (e) => {});

  return (
    <>
      <Select
        value={channel[colorEventMenuViewProps.bus.color].value()}
        onChange={(e) => channel.emit(colorEventMenuViewProps.bus.color, e)}
      >
        <SelectTrigger>
          <SelectPlaceholder>Choose a color</SelectPlaceholder>
          <SelectValue />
          <SelectIcon />
        </SelectTrigger>
        <SelectContent>
          <SelectListbox>
            <For each={["red", "yellow", "black", "blue", "Steelblue"]}>
              {(item) => (
                <SelectOption value={item}>
                  <SelectOptionText>{item}</SelectOptionText>
                  <SelectOptionIndicator />
                </SelectOption>
              )}
            </For>
          </SelectListbox>
        </SelectContent>
      </Select>
    </>
  );
};

const ColorEventView = (props) => {
  const colorEventProps = mergeProps(props);
  //channel.colorA.listen((e) => {});
  channel.on(colorEventProps.bus.color, (e) => {});

  let fillcolor;
  const fillcolorFn = (e) => {
    e.preventDefault();

    //channel.colorA.emit(fillcolor.value);
    channel.emit(colorEventProps.bus.color, fillcolor.value);
  };

  return (
    <div>
      <form onsubmit={fillcolorFn}>
        <InputGroup>
          <InputLeftAddon>Color</InputLeftAddon>
          <Input type="text" placeholder="new color" ref={fillcolor} />
        </InputGroup>

        <Button colorScheme="primary" type="submit">
          New Color
        </Button>
      </form>
    </div>
  );
};

const ColorView = (props) => {
  const [fillcolor, setFillcolor] = createSignal("steelblue");
  const plotProps = mergeProps(props);

  let fc;
  const fcf = (e) => {
    e.preventDefault();
    // let ftx = document.getElementById(`fc${newProps.tag}`);
    setFillcolor(fc.value);
  };

  let qt;
  const fn = (event) => {
    event.preventDefault();
    //let vtx = document.getElementById(`tx${newProps.tag}`);
    setDataLink(plotProps.tag, { where: YAML.parse(qt.value) });
    //setAction(YAML.parse(vtx.value));
  };

  return (
    <div>
      <form onsubmit={fn}>
        <FormLabel>Enter Hasura Query</FormLabel>

        <Textarea onSubmit={fn} ref={qt}></Textarea>
        <Button colorScheme="secondary" type="submit">
          query
        </Button>
      </form>

      <form onsubmit={fcf}>
        <InputGroup>
          <InputLeftAddon>Color</InputLeftAddon>
          <Input type="text" placeholder="new color" ref={fc} />
        </InputGroup>

        <Button colorScheme="primary" type="submit">
          New Color
        </Button>
      </form>

      <Dynamic
        component={plotProps.chart}
        info={plotProps.info}
        tag={plotProps.tag}
        color={fillcolor()}
      />
    </div>
  );
};

const PlotGrid = (props) => {
  const plotGridProps = mergeProps(props);

  return (
    <div>
      <Dynamic
        component={plotGridProps.chart}
        info={plotGridProps.info}
        tag={plotGridProps.tag}
        bus={plotGridProps.bus}
      />
    </div>
  );
};

const PlotController = (props) => {
  // const client = createGraphQLClient(newProps.link);

  const [sortDirection, setSortDirection] = createSignal();
  const [action, setAction] = createSignal();
  const [selected, setSelected] = createSignal("bar");
  // const [fillcolor, setFillcolor] = createSignal("steelblue");
  const newProps = mergeProps(props);
  const client = createGraphQLClient(newProps.link);
  setAction(newProps.action);
  setSortDirection(newProps.sortDirection);
  const dataID = createUniqueId();

  //  `${newProps.tag}`
  setDataLink(
    R.fromPairs([
      [
        dataID,
        {
          keyID: `ID-${dataID}`,
          query: newProps.query,
          sort: newProps.sortDirection,
          where: newProps.action,
          filter: "(Sales.SALES)[[0..20]]",
          cache: {},
        },
      ],
    ])
  );

  const [gdata] = client(dataLink[dataID].query, () => ({
    sortDirection: sortDirection(),
    action: dataLink[dataID].where,
    //action: action(),
  }));

  //let fc;

  //setDataLink( l =>  [ ...l , { name: `${newProps.tag}` , cache: gdata()["Disease"] }   ]  );
  //const dataLink$ = from(observable(gdata));

  //    id={`fc${newProps.tag}`}

  /*
  setDataLink( R.fromPairs([[`${newProps.tag}`, {cache: gdata()["Disease"]  }   ]])  );
  setDataLink( R.fromPairs([[`${newProps.tag}`, { query: newProps.query }   ]])  );
  console.log(dataLink[newProps.tag]);
setDataLink(
              R.fromPairs([[`${newProps.tag}`, gdata()["Disease"]]])

*/
  //console.log(dataLink[newProps.tag]);

  return (
    <Box>
      <div>
        <Show when={gdata()} fallback={<div>Loading...</div>}>
          {setDataLink(dataID, {
            cache: JSONPath({ path: newProps.shape, json: gdata() }),
          })}

          <Dynamic
            component={newProps.view}
            layout={newProps.layout}
            info={dataLink[dataID].cache}
            tag={dataID}
          />
        </Show>
      </div>
    </Box>
  );
  //  {setDataLink(dataID, { cache: gdata()["Disease"] })}
  //<div id={newProps.tag}></div>
};

/*

{setDataLink(dataID, {cache: JSONPath({path: newProps.shape, json: gdata() } ) } )}

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

  let dgt;
  const dgn = (event) => {
    event.preventDefault();
    //let dgx = document.getElementById(`dgx${designProps.tag}`);
    setDataLink(`${designProps.tag}`, { where: YAML.parse(dgt.value) });
    //setAction(YAML.parse(vtx.value));
  };

  return (
    <Box>
      <Heading>Design Grid {designProps.tag}</Heading>
      <div>
        <form onsubmit={dgn}>
          <FormLabel>Enter Hasura Query</FormLabel>

          <Textarea ref={dgt}></Textarea>
          <Button colorScheme="secondary" type="submit">
            query
          </Button>
        </form>
      </div>
    </Box>
  );
};

const DataGrid = (props) => {
  //const [headers,setHeaders] = createSignal();
  //let rslt = from(dataLink$);
  //console.log(rslt);
  const dprops = mergeProps(props);
  // setDataNode(dataLink[dprops.tag].cache);
  //const pred = R.whereAny({name: R.equals(`${dprops.tag}`), cache: R.equals(R.__)});
  //if (R.find(pred,dataLink) != undefined)
  //const dl = R.filter(pred, dataLink)[0].cache;
  //console.log( R.filter(pred, dataLink)[0].cache );
  //const tbl = Aq.from(dprops.info);
  // if (dataLink != undefined)
  //console.log(dataLink[dprops.tag]);
  //console.log(dataLink);
  // dataLink[dprops.tag] == undefined ? {} : dataLink[dprops.tag].cache

  const headers = createMemo(() =>
    Object.keys(
      dataLink[dprops.tag] && dataLink[dprops.tag].cache.length > 0
        ? dataLink[dprops.tag].cache[0]
        : {}
    )
  );

  return (
    <Show
      when={dataLink[dprops.tag] && dataLink[dprops.tag].cache.length > 0}
      fallback={<div>loading...</div>}
    >
      <div style={"max-height: 300px;overflow-y: scroll;"}>
        <Table striped="odd" dense>
          <Thead>
            <Tr>
              {headers()?.map((header) => (
                <Th>{header}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            <For each={dataLink[dprops.tag].cache}>
              {(d) => (
                <Tr>
                  {headers()?.map((header) => (
                    <Td> {d[header]}</Td>
                  ))}
                </Tr>
              )}
            </For>
          </Tbody>
        </Table>
      </div>
    </Show>
  );
};

const SalesView = (props) => {
  const salesProps = mergeProps(props);

  return (
    <SimpleGrid columns={2} gap="$2">
      <Box>
        <VStack>
          <Box>
            <DesignGrid tag={salesProps.tag} />
          </Box>
          <Box>
            <DataGrid tag={salesProps.tag} />
          </Box>
        </VStack>
      </Box>
      <Box w={"100%"}>
        <Box>
          <ColorEventMenuView bus={{ color: "colorB" }} />
        </Box>
        <PlotGrid
          chart={ColorEventLine}
          info={salesProps.info}
          tag={salesProps.tag}
          bus={{ color: "colorB" }}
        />
      </Box>
    </SimpleGrid>
  );
};

const TemplateView = (props) => {
  const templateProps = mergeProps(props);

  return (
    <SimpleGrid columns={2} gap="$2">
      <Box>
        <VStack>
          <Box>
            <DesignGrid tag={templateProps.tag} />
          </Box>
          <Box>
            <DataGrid tag={templateProps.tag} />
          </Box>
        </VStack>
      </Box>
      <Box w={"100%"}>
        <Box>
          <ColorEventView bus={{ color: "colorA" }} />
        </Box>
        <PlotGrid
          chart={templateProps.layout.right}
          info={templateProps.info}
          tag={templateProps.tag}
          bus={{ color: "colorA" }}
        />
      </Box>
    </SimpleGrid>
  );
};

function App() {
  //let pDiv;

  return (
    <HopeProvider>
      <VStack spacing={"$1"}>
        <Box>
          <PlotController
            view={TemplateView}
            link={"http://localhost:8080/v1/graphql"}
            shape={"$.Sales.*"}
            layout={{ right: ColorEventBar }}
            action={{
              _and: [{ SALES: { _lte: 900 } }, { STATUS: { _eq: "Shipped" } }],
            }}
            sortDirection={{ ORDERDATE: "asc" }}
            query={gql`
              query (
                $sortDirection: [Sales_order_by!]
                $action: Sales_bool_exp
              ) {
                Sales(order_by: $sortDirection, where: $action) {
                  ORDERDATE
                  SALES
                }
              }
            `}
          />
        </Box>

        <Box>
          <PlotController
            view={SalesView}
            link={"http://localhost:8080/v1/graphql"}
            shape={"$.Sales.*"}
            action={{ SALES: { _lte: 700 } }}
            sortDirection={{ ORDERDATE: "asc" }}
            query={gql`
              query (
                $sortDirection: [Sales_order_by!]
                $action: Sales_bool_exp
              ) {
                Sales(order_by: $sortDirection, where: $action) {
                  ORDERDATE
                  SALES
                }
              }
            `}
          />
        </Box>
      </VStack>
    </HopeProvider>
  );
}

export default App;
