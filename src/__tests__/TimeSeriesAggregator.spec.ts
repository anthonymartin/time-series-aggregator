import moment from "moment";
import TimeSeriesAggregator from "../TimeSeriesAggregator";
import { collection } from "./__data__/collection.data";

test("TimeSeriesAggregator counts objects in collection over selected time period", () => {
  let aggregator = new TimeSeriesAggregator();
  let data = aggregator
    .setCollection(collection)
    .setPeriod(30)
    .setGranularity("day")
    .setGroupBy("createdAt")
    .setEndTime(moment("2019-08-21T09:14:07Z").format()) // this method only needed for testing purposes otherwise tests will fail in the future
    .aggregate();
  let count = data.count(0, 30); // 5
  expect(count).toBe(5);
  expect(count).toBe(collection.length);
});

test("TimeSeriesAggregator can group by month", () => {
  let aggregator = new TimeSeriesAggregator();
  let data = aggregator
    .setCollection(collection)
    .setPeriod(2) // 2 months
    .setGranularity("month")
    .setGroupBy("createdAt")
    .setEndTime(moment("2019-08-21T23:59:59Z").format()) // this method only needed for testing purposes otherwise tests will fail in the future
    .aggregate();
  let countAugust = data.count(0, 1); // 4 objects in the month of august
  expect(countAugust).toBe(4);
  let countJuly = data.count(1, 2); // 1 objects in the month of july
  expect(countJuly).toBe(1);

  countJuly = data.count(1); // 1 objects in the month of july
  expect(countJuly).toBe(1);

  countJuly = data.count(0, 2); // 5 objects in july and august
  expect(countJuly).toBe(5);
});

test("TimeSeriesAggregator can group by day", () => {
  let aggregator = new TimeSeriesAggregator();
  let data = aggregator
    .setCollection(collection)
    .setPeriod(30)
    .setGranularity("day")
    .setGroupBy("createdAt")
    .setEndTime(moment("2019-08-21T23:59:00Z").format()) // this method only needed for testing purposes otherwise tests will fail in the future
    .aggregate();
  let eightDaysAgo = data.count(8); // 4 objects 8 days ago - 2019-08-13
  expect(eightDaysAgo).toBe(2);
});
test("TimeSeriesAggregator setting timezone transforms dates in collection to specified timezone", () => {
  let aggregator = new TimeSeriesAggregator();
  let data = aggregator
    .setCollection(collection)
    .setPeriod(30)
    .setGranularity("day")
    .setGroupBy("createdAt")
    .setEndTime(moment("2019-08-21T12:00:00Z").format()) // this method needed for testing purposes otherwise tests will fail in the future.
    .setTimeZone("Europe/Berlin")
    .aggregate();
  expect(data.getEndTime()).toBe("2019-08-21T12:00:00Z");
  expect(Object.keys(data.getHashMap())[0]).toEqual(
    expect.stringMatching(/.*\+02:00$/)
  );
});

test("can select items, count and sum columns on selected items", () => {
  let aggregator = new TimeSeriesAggregator();
  // lets add property with a number value so we can sum it
  let summableCollection = collection.reduce((map, elem) => {
    elem.total = 2;
    map.push(elem);
    return map;
  }, []);
  let data = aggregator
    .setCollection(summableCollection)
    .setPeriod(30)
    .setGranularity("day")
    .setGroupBy("createdAt")
    .setEndTime(moment("2019-08-21T23:59:00Z").format()) // this method only needed for testing purposes otherwise tests will fail in the future
    .aggregate();
  let selection = data.select(0, 30);
  let count = selection.count();
  let sum = selection.sum("total");
  expect(count).toBe(5);
  expect(sum).toBe(10);
  selection = data.select(8); // select from 8 days ago - 2019-08-13
  expect(selection.count()).toBe(2);
  expect(data.select(8).toArray()[0].length).toBe(2);
  expect(selection.sum("total")).toBe(4);
  expect(selection.sum("totals")).toBe(0); // column doesn't exist
});

test("can group by non-datetime items like block hashes", () => {
  const collection = new TimeSeriesAggregator({
    datetime: false,
    groupBy: "blockHash",
    collection: HASH_COLLECTION,
  });
  expect(
      collection.aggregate().getGroupedCollection()[
        "0xd7aa96574c2ea787e94036eb212743c1a8e51d5ff0628aabc5c501a70c3ab9c6"
      ][0]
  ).toEqual(HASH_COLLECTION[0]);
});

test("can get the average price from a collection", () => {
  const collection = new TimeSeriesAggregator({
    datetime: false,
    groupBy: "blockHash",
    collection: HASH_COLLECTION,
  });
  ;
  expect(
    collection.aggregate().select(0,2).avg("price")
  ).toEqual(2080.4389560657155);
});

export const HASH_COLLECTION = [
  {
      txHash:
        "0xfc204ac2a61ac4fbe6238a062a1d2e1940b0ada29b518a9d87c8ac650c0782d1",
      from: "0x5b2f6835D82504c214e8Ac6d30f6B22d49797dd0",
      price: 2042.1947803285766,
      volume: 264.838909,
      tradeTypeCode: 0,
      to: "0x5b2f6835D82504c214e8Ac6d30f6B22d49797dd0",
      blockHash:
        "0xd7aa96574c2ea787e94036eb212743c1a8e51d5ff0628aabc5c501a70c3ab9c6",
      blockNumber: 28404384,
      timestamp: 1652737764,
      tradeType: "Buy",
      formatted: {
        amount0: "264.838909",
        amount1: "-0.129683471699692172",
        description: "Swapped 264.838909 USDC for 0.12968347169969216 WETH",
        price: "2042.194780",
      },
    },
    {
      txHash:
        "0xfc204ac2a61ac4fbe6238a062a1d2e1940b0ada29b518a9d87c8ac650c0782d1",
      from: "0x5b2f6835D82504c214e8Ac6d30f6B22d49797dd0",
      price: 2090,
      volume: 264.838909,
      tradeTypeCode: 0,
      to: "0x5b2f6835D82504c214e8Ac6d30f6B22d49797dd0",
      blockHash:
        "0xd7aa96574c2ea787e94036eb212743c1a8e51d5ff0628aabc5c501a70c3ab9c6",
      blockNumber: 28404384,
      timestamp: 1652737764,
      tradeType: "Buy",
      formatted: {
        amount0: "264.838909",
        amount1: "-0.129683471699692172",
        description: "Swapped 264.838909 USDC for 0.12968347169969216 WETH",
        price: "2042.194780",
      },
    },
    {
      txHash:
        "0xfc204ac2a61ac4fbe6238a062a1d2e1940b0ada29b518a9d87c8ac650c0782d1",
      from: "0x5b2f6835D82504c214e8Ac6d30f6B22d49797dd0",
      price: 2090,
      volume: 264.838909,
      tradeTypeCode: 0,
      to: "0x5b2f6835D82504c214e8Ac6d30f6B22d49797dd0",
      blockHash:
        "0xd7aa96574c2ea787e94036eb212743c1a8e51d5ff0628aabc5c501a70c3ab9c6",
      blockNumber: 28404384,
      timestamp: 1652737764,
      tradeType: "Buy",
      formatted: {
        amount0: "264.838909",
        amount1: "-0.129683471699692172",
        description: "Swapped 264.838909 USDC for 0.12968347169969216 WETH",
        price: "2042.194780",
      },
    },
    {},
    {},
    {},
    {
      txHash:
        "0xfc204ac2a61ac4fbe6238a062a1d2e1940b0ada29b518a9d87c8ac650c0782d1",
      from: "0x5b2f6835D82504c214e8Ac6d30f6B22d49797dd0",
      price: 2090,
      volume: 264.838909,
      tradeTypeCode: 0,
      to: "0x5b2f6835D82504c214e8Ac6d30f6B22d49797dd0",
      blockHash:
        "0xd7aa96574c2ea787e94036eb212743c1a8e51d5ff0628aabc5c501a70c3ab9c6",
      blockNumber: 28404384,
      timestamp: 1652737764,
      tradeType: "Buy",
      formatted: {
        amount0: "264.838909",
        amount1: "-0.129683471699692172",
        description: "Swapped 264.838909 USDC for 0.12968347169969216 WETH",
        price: "2042.194780",
      },
    },
    {
      txHash:
        "0xfc204ac2a61ac4fbe6238a062a1d2e1940b0ada29b518a9d87c8ac650c0782d1",
      from: "0x5b2f6835D82504c214e8Ac6d30f6B22d49797dd0",
      price: 2090,
      volume: 264.838909,
      tradeTypeCode: 0,
      to: "0x5b2f6835D82504c214e8Ac6d30f6B22d49797dd0",
      blockHash:
        "0xd7aa96574c2ea787e94036eb212743c1a8e51d5ff0628aabc5c501a70c3ab9c6",
      blockNumber: 28404384,
      timestamp: 1652737764,
      tradeType: "Buy",
      formatted: {
        amount0: "264.838909",
        amount1: "-0.129683471699692172",
        description: "Swapped 264.838909 USDC for 0.12968347169969216 WETH",
        price: "2042.194780",
      },
    }
];
