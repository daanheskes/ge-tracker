import React, { useState, useEffect } from 'react';
import './App.css';

function App() {

  const [items, setItems] = useState({});
  const [settings, setSettings] = useState({
    freeItemsOnly: false,
    membersItemsOnly: false,
    minPrice: 0,
    maxPrice: 0,
    minOverallQuantity: 0,
    minPercentageProfit: 1,
  });
  const [shownItems, setShownItems] = useState([]);
  const [timeStamp, setTimeStamp] = useState("");
  const [timePassed, setTimePassed] = useState("00:00");
  

  function fetchItems() {
    const currentTimeStamp = + new Date();
    const linkWithCurrentTimeStamp = "https://rsbuddy.com/exchange/summary.json?ts=" + currentTimeStamp;
    setTimeStamp(currentTimeStamp);

    fetch(linkWithCurrentTimeStamp)
      .then(response => response.json())
      .then(data => {
        setItems(data);
      });
  }

  useEffect(() => {
    const refreshEverySec = setInterval(() => {
      const currentTimeStamp = + new Date();
      const timeDiff = Math.abs(currentTimeStamp - timeStamp);
      const timeDiffInSec = Math.floor(timeDiff / 1000);
      const minutes = Math.floor(timeDiffInSec / 60);
      const seconds = timeDiffInSec % 60;

      if (minutes >= 1) {
        fetchItems();
      }

      function str_pad_left(string, pad, length) {
        return (new Array(length + 1).join(pad) + string).slice(-length);
      }

      const finalTime = str_pad_left(minutes, '0', 2) + ':' + str_pad_left(seconds, '0', 2);

      setTimePassed(finalTime);
    }, 1000);

    return () => {
      clearInterval(refreshEverySec);
    }
  }, [timeStamp]);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    let itemsArr = Object.values(items).filter(x => {
      let isF2pOnly = settings.freeItemsOnly === true;
      let isMembersOnly = settings.membersItemsOnly === true;

      return ((isMembersOnly && x.members === true) || !isMembersOnly)
        && ((isF2pOnly && x.members === false) || !isF2pOnly)
        && (x.sell_average >= settings.minPrice)
        && (x.sell_average <= settings.maxPrice || settings.maxPrice === 0 || settings.maxPrice === "0")
        && x.overall_quantity >= settings.minOverallQuantity
        && (x.buy_average - x.sell_average) / x.buy_average * 100 >= settings.minPercentageProfit
        && x.buy_average !== 0 && x.sell_average !== 0;
    }).sort((a, b) => {
      const aPerc = (a.buy_average - a.sell_average) / a.buy_average;
      const bPerc = (b.buy_average - b.sell_average) / b.buy_average;
      return bPerc - aPerc;
    });

    setShownItems(itemsArr);
  }, [settings, items]);

  function refreshItems() {
    fetchItems();
  }

  function handleChange(e) {
    const { id, value, type, checked } = e.target;

    setSettings(settings => ({
      ...settings,
      [id]: type === "checkbox" ? checked : value
    }));
  }

  return (
    <div className="App">
      <p>{timePassed}</p>
      <button onClick={refreshItems}>Refresh items</button>
      <div className="settings">
        {
          Object.entries(settings).map(x => {
            const [name, value] = x;

            if (name === "freeItemsOnly" || name === "membersItemsOnly") {
              return (
                <div key={name}>
                  <label htmlFor={name}>{name}</label>
                  <input type="checkbox" id={name} onChange={handleChange} checked={value} />
                </div>
              )
            }
            return (
              <div key={name}>
                <label htmlFor={name}>{name}</label>
                <input type="text" id={name} value={value} onChange={handleChange} size="10" />
              </div>
            );
          })
        }
      </div>
      <div className="item-container">
        {
          shownItems.map(x => {
            return (
              <div className="item" key={x.id}>
                <p className="item__name">{x.name}</p>
                <p><b>Buy:</b> {x.sell_average}</p>
                <p><b>Sell:</b> {x.buy_average}</p>
                <p><b>Qty:</b> {x.overall_quantity}</p>
                <p><b>Profit:</b> {x.buy_average - x.sell_average} ({((x.buy_average - x.sell_average) / x.buy_average * 100).toFixed(2)}%)</p>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

export default App;
