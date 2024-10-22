import React, { useEffect, useState } from 'react';
import CryptoJS from 'crypto-js';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [hasDescriptionFilter, setHasDescriptionFilter] = useState('all');
  const [minComicsFilter, setMinComicsFilter] = useState(0); // Minimum number of comics
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const publicKey = '3d1a9b4125d1b1e21bfd06f79f6f2e8e';
  const privateKey = '9d3b5d38b059b323102bf45d2a811b40621c2031';

  const getHash = (ts) => {
    return CryptoJS.MD5(ts + privateKey + publicKey).toString();
  };

  useEffect(() => {
    const fetchData = async () => {
      const ts = new Date().getTime(); // Timestamp
      const hash = getHash(ts); // Generate the hash

      try {
        const response = await fetch(
          `https://gateway.marvel.com/v1/public/characters?ts=${ts}&apikey=${publicKey}&hash=${hash}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result.data.results || []);
        setFilteredData(result.data.results || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle search input and filter the data
  const handleSearch = (event) => {
    const value = event.target.value.toLowerCase();
    setSearchInput(value);
    filterData(value, hasDescriptionFilter, minComicsFilter);
  };

  // Handle description filter
  const handleDescriptionFilter = (event) => {
    const value = event.target.value;
    setHasDescriptionFilter(value);
    filterData(searchInput, value, minComicsFilter);
  };

  // Handle minimum comics filter
  const handleMinComicsFilter = (event) => {
    const value = parseInt(event.target.value, 10);
    setMinComicsFilter(value);
    filterData(searchInput, hasDescriptionFilter, value);
  };

  // Filter data based on search input, description presence, and minimum comics
  const filterData = (searchInput, hasDescriptionFilter, minComicsFilter) => {
    let filtered = data;

    if (searchInput !== '') {
      filtered = filtered.filter((character) =>
        character.name.toLowerCase().includes(searchInput)
      );
    }

    if (hasDescriptionFilter !== 'all') {
      if (hasDescriptionFilter === 'yes') {
        filtered = filtered.filter((character) => character.description.trim().length > 0);
      } else if (hasDescriptionFilter === 'no') {
        filtered = filtered.filter((character) => character.description.trim().length === 0);
      }
    }

    filtered = filtered.filter((character) => character.comics.available >= minComicsFilter);

    setFilteredData(filtered);
  };

  // Helper function to calculate the median
  const calculateMedian = (numbers) => {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
  };

  // Calculating the summary statistics
  const totalCharacters = filteredData.length;
  const comicsCounts = filteredData.map((character) => character.comics.available);
  const medianComics = calculateMedian(comicsCounts);
  const minComics = Math.min(...comicsCounts);
  const maxComics = Math.max(...comicsCounts);
  const comicsRange = maxComics - minComics;

  return (
    <div className="App">
      <h1>Marvel Characters</h1>

      {error ? (
        <p>Error: {error}</p>
      ) : loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* Summary Statistics */}
          <div className="summary-container">
            <div className="summary-item">
              <p><strong>Total Characters:</strong></p>
              <p>{totalCharacters}</p>
            </div>
            <div className="summary-item">
              <p><strong>Median Comics Count:</strong></p>
              <p>{medianComics}</p>
            </div>
            <div className="summary-item">
              <p><strong>Comics Range:</strong></p>
              <p>{minComics} - {maxComics} (Range: {comicsRange})</p>
            </div>
          </div>

          {/* Filters section - placed side by side */}
          <div className="filters-container">
            <div className="search">
            <label>Search by name</label>
            <input
              type="text"
              placeholder="Search for a character..."
              value={searchInput}
              onChange={handleSearch}
              className="filter-item"
            />
            </div>

            <div className="filter-item">
              <label>Has Description</label>
              <select value={hasDescriptionFilter} onChange={handleDescriptionFilter}>
                <option value="all">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div className="filter-item">
              <label>Minimum Comics</label>
              <input
                type="number"
                value={minComicsFilter}
                onChange={handleMinComicsFilter}
                min="0"
              />
            </div>
          </div>

          {/* List of characters */}
          <ul className="character-list">
            {filteredData.length > 0 ? (
              filteredData.map((character) => (
                <li key={character.id} className="character-item">
                  <img
                    src={`${character.thumbnail.path}.${character.thumbnail.extension}`}
                    alt={character.name}
                    className="character-icon"
                  />
                  <div className="character-details">
                    <h2>{character.name}</h2>
                    <p>{character.description || 'No description available.'}</p>
                    <p>Comics: {character.comics.available}</p>
                  </div>
                </li>
              ))
            ) : (
              <p>No results found</p>
            )}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;
