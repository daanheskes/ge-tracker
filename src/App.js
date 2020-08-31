import React, { useState, useEffect } from 'react';
import './App.css';

function App() {

  const [items, setItems] = useState({});
  const [settings, setSettings] = useState({
    minPrice: 0,
    maxPrice: 0,
    minOverallQuantity: 0,
    minPercentageProfit: 1,
  });
  const [shownItems, setShownItems] = useState([]);
  const [timeStamp, setTimeStamp] = useState("");
  

  function fetchItems() {
    const currentTimeStamp = + new Date();
    const linkWithCurrentTimeStamp = "https://rsbuddy.com/exchange/summary.json?ts=" + currentTimeStamp;
    setTimeStamp(currentTimeStamp);

    fetch(linkWithCurrentTimeStamp)
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setItems(data);
      });
  }

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    let itemsArr = Object.values(items).filter(x => {
      return (x.sell_average >= settings.minPrice)
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
    const { id, value } = e.target
    setSettings(settings => ({
      ...settings,
      [id]: value
    }));
  }

  return (
    <div className="App">
      <p>{timeStamp}</p>
      <button onClick={refreshItems}>Refresh items</button>
      <div className="settings">
        {
          Object.entries(settings).map(x => {
            const [name, value] = x;
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
