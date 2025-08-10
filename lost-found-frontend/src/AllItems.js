import React, { useState, useEffect } from "react";
import "./AllItems.css";

export default function AllItems() {
  const [items, setItems] = useState([]);
  const [formVisible, setFormVisible] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState("lost");

  useEffect(() => {
    fetch("http://localhost:5000/items")
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch((err) => console.error("Error fetching items:", err));
  }, []);

  const filteredItems = items.filter((item) => item.status === filter);

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setItems([data, ...items]);
      setFormVisible(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="tabs">
        <button
          className={filter === "lost" ? "active" : ""}
          onClick={() => setFilter("lost")}
        >
          Lost
        </button>
        <button
          className={filter === "found" ? "active" : ""}
          onClick={() => setFilter("found")}
        >
          Found
        </button>
      </div>

      <div className="feed-container">
        <div className="feed">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="card"
              onClick={() =>
                setExpandedId(expandedId === item.id ? null : item.id)
              }
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className={`item-image ${
                  expandedId === item.id ? "expanded" : ""
                }`}
              />
              <div className="item-details">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <p className="location">📍 {item.location || "N/A"}</p>
              </div>
            </div>
          ))}
        </div>

        {formVisible ? (
          <form className="upload-form" onSubmit={handleUpload}>
            <input type="text" name="title" placeholder="Item title" required />
            <input
              type="text"
              name="description"
              placeholder="Description"
              required
            />
            <input type="text" name="location" placeholder="Location" required />
            <select name="status" defaultValue="lost">
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
            <input type="file" name="image" accept="image/*" required />
            <input
              type="text"
              name="secretDetail"
              placeholder="Secret detail (private)"
              required
            />
            <button type="submit">Upload</button>
          </form>
        ) : (
          <button className="upload-toggle" onClick={() => setFormVisible(true)}>
            ➕ Add Item
          </button>
        )}
      </div>
    </>
  );
}
