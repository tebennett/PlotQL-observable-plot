import {
  createSignal,
  Show,
  mergeProps,
  createMemo,
  createUniqueId,
  createEffect,
  createComputed,
} from "solid-js";
import { createStore, produce } from "solid-js/store";

import * as Plot from "@observablehq/plot";
import { timeFormat, isoParse } from "d3-time-format";
import { createGraphQLClient, gql, request } from "@solid-primitives/graphql";

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

const [flex, set] = createStore({});

const format = timeFormat("%y-%m-%d");
const formatDate = (date) => format(isoParse(date));

set(
  produce((s) => {
    s.colorA = "red";
    s.colorB = "steelblue";
  })
);

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
            x: (d) => formatDate(d.Order_Date),
            y: "Profit",
            stroke: flex[colorEventLineProps.bus.color],
          }),
        ],
      })}
    </div>
  );
};

const ColorEventBar = (props) => {
  const colorEventBarProps = mergeProps(props);
//console.log(colorEventBarProps.info);
  return (
    <div>
      {Plot.plot({
        marginLeft: 120,
        marks: [
          Plot.ruleY([0]),
          Plot.barY(colorEventBarProps.info, {
            x: (d) => formatDate(d.Order_Date),
            y: "Profit",
            fill: flex[colorEventBarProps.bus.color],
          }),
        ],
      })}
    </div>
  );
};

const ColorEventMenuView = (props) => {
  const colorEventMenuViewProps = mergeProps(props);

  return (
    <>
      <Select
        value={flex[colorEventMenuViewProps.bus.color]}
        onChange={(e) =>
          set(
            produce((s) => {
              s[colorEventMenuViewProps.bus.color] = e;
            })
          )
        }
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

    set(
      produce((s) => {
        s[colorEventProps.bus.color] = fillcolor.value;
      })
    );
  };
  
  /*
  createComputed(() => {
    set(
      produce((s) => {
        s.colorB = R.toUpper(flex.colorA);
        s.colorC = R.toLower(flex.colorB);
      })
    );
  });
  
*/

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

  set(
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

  const [gdata] = client(flex[dataID].query, () => ({
    sortDirection: sortDirection(),
    action: flex[dataID].where,
  }));

  return (
    <Box>
      <div>
        <Show when={gdata()} fallback={<div>Loading...</div>}>
          {set(dataID, {
            cache: JSONPath({ path: newProps.shape, json: gdata() }),
          })}

          <Dynamic
            component={newProps.view}
            layout={newProps.layout}
            info={flex[dataID].cache}
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

    set(`${designProps.tag}`, { where: YAML.parse(dgt.value) });
  };

  return (
    <Box>
      <Heading>Design Grid {designProps.tag}</Heading>
      <div>
        <form onsubmit={dgn}>
          <FormLabel>Enter Query</FormLabel>

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
      flex[dprops.tag] && flex[dprops.tag].cache.length > 0
        ? flex[dprops.tag].cache[0]
        : {}
    )
  );

  return (
    <Show
      when={flex[dprops.tag] && flex[dprops.tag].cache.length > 0}
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
            <For each={flex[dprops.tag].cache}>
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
            shape={"$.superstore.*"}
            layout={{ right: ColorEventBar }}
            action={{
              Profit: {_lte: 9000},
            }}
            sortDirection={{ Order_Date: "asc" }}
            query={gql`
              query (
                $sortDirection: [superstore_order_by!]
                $action: superstore_bool_exp
              ) {
                superstore(order_by: $sortDirection, where: $action) {
                  Order_Date
                  Profit
                }
              }
            `}
          />
        </Box>

        <Box>
          <PlotController
            view={SalesView}
            link={"http://localhost:8080/v1/graphql"}
            shape={"$.superstore.*"}
            action={{ Profit: { _gte: 2000 } }}
            sortDirection={{ Order_Date: "asc" }}
            query={gql`
              query (
                $sortDirection: [superstore_order_by!]
                $action: superstore_bool_exp
              ) {
                superstore(order_by: $sortDirection, where: $action) {
                  Order_Date
                  Profit
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
