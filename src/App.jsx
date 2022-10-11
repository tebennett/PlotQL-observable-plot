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
import {
  createEventHub,
  createEventBus,
  createEventStack,
} from "@solid-primitives/event-bus";
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

const [mobius, set] = createStore({});

const format = timeFormat("%y-%m-%d");
const formatDate = (date) => format(isoParse(date));
const [dataLink, setDataLink] = createStore({});

/*
set(
  produce((s) => {
    s.channel[actions.name] = actions.data;
  })
);
*/

const dispatcher = (actions) => {
  switch (actions.task) {
    case "HSET":
      set(
        produce((s) => {
          s[actions.name] = actions.data;
        })
      );
      break;
    case "SLISTEN":
      set(
        produce((s) => {
          s[actions.name].listen = actions.data;
        })
      );
      break;
    case "SEMIT":
      set(
        produce((s) => {
          s[actions.name].emit(actions.data);
        })
      );
      break;
    case "APPLY":
      mobius.ops[actions.name](actions.data);
      break;
    case "DEFINE":
      set(
        produce((s) => {
          s.ops[actions.name] = actions.data;
        })
      );
  }
};

/*
const dispatcher = (actions) => {   // mobius.driver[actions.driver].emit(actions.payload);
  switch (actions.driver) {
    case "event":
      mobius.driver.event.emit(actions.payload);
      break;
    case "graphql":
      mobius.driver.graphql.emit(actions.payload);
      break;
  }
};
*/

set(
  produce((s) => {
    s.bus = createEventBus({
      value: { task: "HSET", name: "colorA", data: "red" },
    });
    s.dispatch = (x) => dispatcher(x);
    s.hub = {};
    s.ops = {};
  })
);

const ls = (e) => mobius.dispatch(e);
//const eventLs = (e) => eventDispatcher(e);
mobius.bus.listen(ls);
//mobius.driver.event.listen(eventLs);
console.log("log: " + mobius.bus.value());
//mobius.bus.emit("hi");
//console.log("log: " + mobius.bus.value());
//mobius.bus.emit({ task: "SET_CHANNEL", name: "colorB", data: "blue" });
//mobius.dispatch;
console.log(mobius);
mobius.bus.emit({ task: "HSET", name: "colorA", data: "red" });
console.log(mobius);
mobius.bus.emit({
  task: "HSET",
  name: "stateA",
  data: { address: { phone: 123 } },
});
console.log(mobius);
mobius.bus.emit({
  task: "DEFINE",
  name: "SADDRESS",
  data: (x) => {
    set("stateA", "address", x.c, x.num);
  },
});

// set( x.a,x.b,x.c,x.num);
//data: {a: "stateA", b: "address", c: "phone", num: 456}

console.log(mobius);
mobius.bus.emit({
  task: "APPLY",
  name: "SADDRESS",
  data: { c: "phone", num: 456 },
});
console.log(mobius);
mobius.bus.emit({ task: "HSET", name: "colorB", data: createEventBus() });
console.log(mobius);
mobius.bus.emit({ task: "SLISTEN", name: "colorB", data: (e) => {} });
console.log(mobius);
mobius.bus.emit({
  task: "SEMIT",
  name: "colorB",
  data: (x) => R.toUpper(mobius.colorA),
});
console.log(mobius);
console.log(mobius.colorB.value());
mobius.bus.emit({
  task: "HSET",
  name: "stateB",
  data: { mean: 135 },
});
console.log(mobius);

mobius.bus.emit({
  task: "HSET",
  name: "stateB",
  data: R.multiply(mobius.stateB.mean, mobius.stateB.mean),
});
console.log(mobius);
//mobius.bus.emit({ task: "addBus" , name: "colorA", data: "yellow" } );
//console.log(mobius);
//mobius.bus.emit({ task: "addCache" , name: "salesA", data: [ {x: 1, y: 1}, {x: 2, y: 2}] } );
//console.log(mobius);

const channel = createEventHub({
  colorA: createEventBus({ value: "steelblue" }),
  colorB: createEventBus({ value: "yellow" }),
});

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
            fill: mobius[colorEventBarProps.bus.color], //channel[colorEventBarProps.bus.color].value()
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

  let fillcolor;
  const fillcolorFn = (e) => {
    e.preventDefault();

    mobius.bus.emit({
      task: "HSET",
      name: colorEventProps.bus.color,
      data: fillcolor.value,
    });
  };

  return (
    <div>
      <div>{mobius.colorB.value()}</div>
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
  const [sortDirection, setSortDirection] = createSignal();
  const [action, setAction] = createSignal();

  const newProps = mergeProps(props);
  const client = createGraphQLClient(newProps.link);
  setAction(newProps.action);
  setSortDirection(newProps.sortDirection);
  const dataID = createUniqueId();

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
  }));

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
};

const DesignGrid = (props) => {
  const designProps = mergeProps(props);

  let dgt;
  const dgn = (event) => {
    event.preventDefault();

    setDataLink(`${designProps.tag}`, { where: YAML.parse(dgt.value) });
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
  const dprops = mergeProps(props);

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
