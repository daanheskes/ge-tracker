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

      if (minutes >= 3) {
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

      const [buy, sell] = getPrices(x);

      return ((isMembersOnly && x.members === true) || !isMembersOnly)
        && ((isF2pOnly && x.members === false) || !isF2pOnly)
        && (buy >= settings.minPrice)
        && (buy <= settings.maxPrice || settings.maxPrice === 0 || settings.maxPrice === "0")
        && (x.overall_quantity >= settings.minOverallQuantity)
        && (sell - buy) / buy * 100 >= settings.minPercentageProfit
        && buy !== 0
        && sell !== 0;
    }).sort((a, b) => {
      const [aBuy, aSell] = getPrices(a);
      const [bBuy, bSell] = getPrices(b);
      const aRatio = (aSell - aBuy) / aBuy;
      const bRatio = (bSell - bBuy) / bBuy;

      return bRatio - aRatio;
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

  function getPrices(item) {
    const buy = item.sell_average;
    const sell = item.buy_average;
    return [buy, sell];
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
            const [buy, sell] = getPrices(x);
            return (
              <div className="item" key={x.id}>
                <p className="item__name">{x.name}</p>
                <p><b>Buy:</b> {buy}</p>
                <p><b>Sell:</b> {sell}</p>
                <p><b>Qty:</b> {x.overall_quantity}</p>
                <p><b>Profit:</b> {sell - buy} ({((sell - buy) / buy * 100).toFixed(2)}%)</p>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

export default App;
