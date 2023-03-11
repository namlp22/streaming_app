import "./App.css";

function App() {
  return (
    <div>
      <video id="videoPlayer" width="100%" controls muted autoPlay>
        <source
          src="http://localhost:8888/video/download/1a0deec2408cf52bbc5145417db8ea69.mp4"
          type="video/mp4"
        />
      </video>
    </div>
  );
}

export default App;
