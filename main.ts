import { Application, Context } from "https://deno.land/x/abc@v1.3.3/mod.ts";
export { }
let log = console.log
let formatter = Intl.DateTimeFormat()


async function getPredictions() {
  let res = await fetch("https://www.metaculus.com/api2/questions/5121/").then((x) => x.json())
  let max = Date.parse(res.possibilities.scale.max)
  let min = Date.parse(res.possibilities.scale.min)

  function predToTimestamp(frame: number) {
    return (max - min) * frame + min
  }

  let f: any[] = res.prediction_timeseries
  let history = f.slice(f.length - 10, f.length).map(
      (f) => ({
        t: Math.ceil(f.t * 1000),
        pred: predToTimestamp(f.community_prediction.q2)
      })
    )

  let latest = res.prediction_timeseries.findLast(() => true)
  return {
    history,
    p25: predToTimestamp(latest.community_prediction.q1),
    p50: predToTimestamp(latest.community_prediction.q2),
    p75: predToTimestamp(latest.community_prediction.q3),
  }
}

let currentProb = await getPredictions()

let task = () => getPredictions().then((pred) => {
  currentProb = pred
  // log(`Updated prediction. Now: ${formatter.format(pred)}`)
  setTimeout(task, 30000)
}).catch((err) => {
  log(err)
  setTimeout(task, 30000)
})
await task()

function method_getProb(rq: Context) {
  return { prediction: currentProb }
}


let app = new Application()
app
  .get("/get_prob", method_getProb)
  .file("/", "static/index.html")
  .start({ port: 8888 })

