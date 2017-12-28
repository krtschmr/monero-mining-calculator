/*
  MoneroMineCalc.js 0.1
  Tim Kretschmer
  tim@krtschmr.de
*/
import React from "react";
import { render } from "react-dom";

if (!Array.prototype.last) {
  Array.prototype.last = function() {
    return this[this.length - 1];
  };
}

Date.prototype.addDays = function(days) {
  var dat = new Date(this.valueOf());
  dat.setDate(dat.getDate() + days);
  return dat;
};

function monthDiff(d1, d2) {
  var months;
  months = (d2.getFullYear() - d1.getFullYear()) * 12;
  months -= d1.getMonth() + 1;
  months += d2.getMonth();
  return months <= 0 ? 0 : months;
}

function days_between(date1, date2) {
  // The number of milliseconds in one day
  var ONE_DAY = 1000 * 60 * 60 * 24;

  // Convert both dates to milliseconds
  var date1_ms = date1.getTime();
  var date2_ms = date2.getTime();

  // Calculate the difference in milliseconds
  var difference_ms = Math.abs(date1_ms - date2_ms);

  // Convert back to days and return
  return Math.round(difference_ms / ONE_DAY);
}

const styles = {
  fontFamily: "sans-serif",
  textAlign: "center"
};

class Calculator extends React.Component {
  changeHashrate(event) {
    this.setState({ hashrate: event.target.value });
  }

  changeNetworkHashrate(event) {
    this.setState({ network: event.target.value });
  }

  changeDays(event) {
    this.setState({ days: event.target.value });
  }

  changeIncrease(event) {
    this.setState({ network_increase: event.target.value });
  }

  changePoolfee(event) {
    this.setState({ pool_fee: event.target.value });
  }

  calculateRewards() {
    var monero_launch_date = new Date("2014-04-18");
    var days = this.state.days;
    if (days < 1) {
      days = 1;
    }

    var days_of_calculation =
      days_between(monero_launch_date, new Date()) + (days - 1);

    var rewards = [];

    for (var i = 0; i < days_of_calculation; i++) {
      var supply = 0;
      var blocktime = 1440;
      var blockreward = 0;

      if (i > 0) {
        //debugger;
        var supply = rewards.last().supply + rewards.last().daily;
      }

      if (i < 706) {
        blockreward =
          (Math.pow(2, 64) - 1 - supply * Math.pow(10, 12)) *
          Math.pow(2, -20) *
          Math.pow(10, -12);
      } else if (i < 2964) {
        blockreward =
          (Math.pow(2, 64) - 1 - supply * Math.pow(10, 12)) *
          Math.pow(2, -19) *
          Math.pow(10, -12);
        blocktime = 720;
      } else {
        blockreward = 0.6;
        blocktime = 720;
      }

      var daily = blocktime * blockreward;
      var date = monero_launch_date.addDays(i);
      var months_mined_already = monthDiff(new Date(), date);
      var base_network = this.state.network * 1000000;
      var expected_network = base_network * Math.pow( 1 + this.state.network_increase / 100, months_mined_already );
      var estimated = this.state.hashrate * blockreward * blocktime / expected_network;

      var today = {
        date: date,
        day: i + 1,
        supply: supply,
        blockreward: blockreward,
        daily: daily,
        blocktime: blocktime,
        network: expected_network / 1000000,
        income: estimated / 100.0 * (100.0 - this.state.pool_fee)
      };

      // for performance reasons, we don't need to display the history.
      // we only care about our mining future, so just clear the array
      // we still need to push today otherwise we can't calculate for tomorrow
      if (date < new Date()) {
        rewards = [];
      }
      rewards.push(today);
    }

    return rewards;
  }

  constructor(props) {
    super(props);

    fetch("https://moneroblocks.info/api/get_stats")
      .then(response => {
        return response.json();
      })
      .then(json => {
        this.setState({
          network: (json.hashrate / 1000000.0).toFixed(3)
        });
      });

    this.state = {
      hashrate: 800,
      network: 500,
      days: 90,
      network_increase: 15,
      rewards: [],
      pool_fee: 0.6
    };

    this.changeHashrate = this.changeHashrate.bind(this);
    this.changeNetworkHashrate = this.changeNetworkHashrate.bind(this);
    this.changeDays = this.changeDays.bind(this);
    this.changeIncrease = this.changeIncrease.bind(this);
    this.changePoolfee = this.changePoolfee.bind(this);
  }
  render() {
    var rewards = this.calculateRewards();
    var totalIncome = rewards.reduce(function(s, a) {
      return s + a.income;
    }, 0);

    var monthly = {};

    var tmp_month = "";
    var current_month = "";
    var monthly_income = 0.0;

    rewards.map(function(row, i) {
      var tmp_month = row.date.getMonth() + 1 + "/" + row.date.getFullYear();
      if (monthly[tmp_month] == null) {
        monthly[tmp_month] = 0.0;
      }
      monthly[tmp_month] += row.income;
    });

    return (
      <div>
        <form>
          <div className="form-group row">
            <label
              for="hashrate"
              className="col-sm-3 col-form-label col-form-label-sm"
            >
              Your Hashrate (H/s)
            </label>
            <div className="col">
              <input
                type="text"
                className="form-control form-control-sm"
                id="hashrate"
                placeholder="Your Hashrate (H/s)"
                onChange={this.changeHashrate}
                value={this.state.hashrate}
              />
            </div>
          </div>
          <div className="form-group row">
            <label
              for="hashrate"
              className="col-sm-3 col-form-label col-form-label-sm"
            >
              Network Hashrate (MH/s)
            </label>
            <div className="col">
              <input
                type="text"
                className="form-control form-control-sm"
                id="networkhashrate"
                placeholder="Network Hashrate (MH/s)"
                onChange={this.changeNetworkHashrate}
                value={this.state.network}
              />
            </div>
          </div>
          <div className="form-group row">
            <label
              for="hashrate"
              className="col-sm-3 col-form-label col-form-label-sm"
            >
              Network increase per month (%)
            </label>
            <div className="col">
              <input
                type="text"
                className="form-control form-control-sm"
                id="network_increase"
                placeholder="Network increase per month (%)"
                onChange={this.changeIncrease}
                value={this.state.network_increase}
              />
            </div>
          </div>
          <div className="form-group row">
            <label
              for="hashrate"
              className="col-sm-3 col-form-label col-form-label-sm"
            >
              Amount of days calculated
            </label>
            <div className="col">
              <input
                type="text"
                className="form-control form-control-sm"
                id="days"
                placeholder="Amount of days calculated"
                onChange={this.changeDays}
                value={this.state.days}
              />
            </div>
          </div>

          <div className="form-group row">
            <label
              for="hashrate"
              className="col-sm-3 col-form-label col-form-label-sm"
            >
              Poolfee in %
            </label>
            <div className="col">
              <input
                type="text"
                className="form-control form-control-sm"
                id="days"
                placeholder="Poolfee in %"
                onChange={this.changePoolfee}
                value={this.state.pool_fee}
              />
            </div>
          </div>
        </form>

        <hr />
        <table className="table table-hovered table-sm">
          <thead>
            <tr>
              <th>Date</th>
              <th>Blockreward</th>
              <th> Income </th>
              <th> Network </th>
              <th> Daily XMR emission </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="5" className="text-center bg-success">
                <br />
                <strong>
                  {" "}
                  Total mined in {this.state.days} days:{" "}
                  {totalIncome.toFixed(2)} XMR{" "}
                </strong>
                <br />
                <br />
              </td>
            </tr>
            <tr>
              <th colSpan="5" className="text-center">
                Overview by month
              </th>
            </tr>
            <tr>
              <td colSpan="5">
                <table className="table table-striped table-sm">
                  <tbody>
                    {Object.keys(monthly).map(function(key) {
                      return (
                        <tr>
                          <td className="text-center">{key}</td>
                          <td className="text-center">{monthly[key].toFixed(4)} XMR</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </td>
            </tr>

            {rewards.map((row, i) => (
              <tr key={i}>
                <td>{row.date.toLocaleDateString("en-US")}</td>
                <td>{row.blockreward.toLocaleString("en-US")}</td>
                <td>{row.income.toFixed(6)}</td>
                <td>{row.network.toFixed(0).toLocaleString("en-US")} MH/s</td>
                <td>{row.daily.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

const App = () => (
  <div id="calculator">
    <Calculator />
  </div>
);

render(<App />, document.getElementById("root"));
