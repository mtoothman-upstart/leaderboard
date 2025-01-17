import _ from "lodash";
import { PartString, Player } from "./player_row";

interface AocApi {
  members: MembersType;
  owner_id: string;
  event: string;
}

interface MembersType {
  (key: string): MemberType;
}

interface MemberType {
  global_score: number;
  name: string;
  local_score: number;
  id: string;
  last_star_ts: string | number;
  completion_day_level: {(day: string): {(star_index: PartString): {get_star_ts: number;}}};
  stars: number;
}

export async function get_data() {
  const data = JSON.parse(await (await fetch('https://codycar.se/leaderboard-api')).text()) as AocApi;
  const members:MembersType = data.members;
  let vals:MemberType[] = Object.values(members);
  vals = vals.filter((v) => v.stars > 0);
  const players: Player[] = vals.map((player) => {
    return {
      ...player,
      gold_medals: Object.fromEntries(_.range(1, 26).map(i => [i.toString(), {}])),
      silver_medals: Object.fromEntries(_.range(1, 26).map(i => [i.toString(), {}])),
      bronze_medals: Object.fromEntries(_.range(1, 26).map(i => [i.toString(), {}])),
      stars_ts: Object.fromEntries(Object.entries(player.completion_day_level).map(([d, s]) => {
        return [d, Object.fromEntries(Object.keys(s).map(k => [k, s[k].get_star_ts]))]
      }))
    };
  });

  for (let dayInt = 1; dayInt <= 25; dayInt++) {
    const day = dayInt.toString();

    const partOneTimes = players.map((p) => {
      const ts = p.stars_ts && p.stars_ts[day] && p.stars_ts[day]["1"];

      return ts ? { id: p.id, ts } : null;
    });
    const topPartOne = _.orderBy(_.compact(partOneTimes), 'ts').slice(0, 3);
    const partOneGold = topPartOne[0];
    const partOneSilver = topPartOne[1];
    const partOneBronze = topPartOne[2];
    if (partOneGold) {
      players.find((p) => p.id === partOneGold.id)!.gold_medals[day]["1"] = partOneGold.ts;
    }
    if (partOneSilver) {
      players.find((p) => p.id === partOneSilver.id)!.silver_medals[day]["1"] = partOneSilver.ts;
    }
    if (partOneBronze) {
      players.find((p) => p.id === partOneBronze.id)!.bronze_medals[day]["1"] = partOneBronze.ts;
    }
    const partTwoTimes = players.map((p) => {
      const ts = p.stars_ts[day] && p.stars_ts[day]["2"];

      return ts ? { id: p.id, ts } : null;
    });
    const topPartTwo = _.orderBy(_.compact(partTwoTimes), 'ts').slice(0, 3);
    const partTwoGold = topPartTwo[0];
    const partTwoSilver = topPartTwo[1];
    const partTwoBronze = topPartTwo[2];
    if (partTwoGold) {
      const found = players.find((p) => p.id === partTwoGold.id);
      found!.gold_medals[day]["2"] = partTwoGold.ts;
    }
    if (partTwoSilver) {
      players.find((p) => p.id === partTwoSilver.id)!.silver_medals[day]["2"] = partTwoSilver.ts;
    }
    if (partTwoBronze) {
      players.find((p) => p.id === partTwoBronze.id)!.bronze_medals[day]["2"] = partTwoBronze.ts;
    }
  }
  return players;
}