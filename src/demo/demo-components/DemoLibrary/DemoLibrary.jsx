import { useState, useEffect } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import "./DemoLibrary.css";
import DemoChooseTextCard from "../DemoChooseTextCard/DemoChooseTextCard";

function DemoLibrary({
  handleBackArrowClick,
  textSelection,
  setTextSelection,
}) {
  const [mainText, setMainText] = useState(textSelection);
  const [bookshelfTexts, setBookShelfTexts] = useState([]);

  useEffect(() => {
    const difficulties = ["beginner", "intermediate", "advanced"];
    const filteredBooks = difficulties.filter(
      (difficulty) => difficulty !== textSelection
    );
    setMainText(textSelection);
    setBookShelfTexts(filteredBooks);
  }, [textSelection]);
  return (
    <main className="DemoLibrary">
      <header className="demo-library-header-container">
        <h1 className="demo-library-sidebar-heading">Library</h1>
        <ChevronLeftIcon
          fontSize="large"
          data-tooltip-id="library-tooltip"
          onClick={handleBackArrowClick}
          className="demo-library-arrowBack"
          color="#006769"
        />
      </header>
      <section className="demo-library-subtext">
        <p>Choose a different text to use this demo.</p>
        <p>
          In the full version of KnowNative, you can import any text you want.
        </p>
      </section>
      <section className="demo-library-currently-reading-container">
        <h5>Currently Reading:</h5>
        <DemoChooseTextCard
          textSelection={mainText}
          isActiveText={true}
          isTopOfBookshelf={false}
        />
        {/* Text cards to be implemented here */}
      </section>
      <section className="demo-library-bookshelf-container">
        <h5 className="demo-library-bookshelf-label">Bookshelf:</h5>
        {bookshelfTexts.map((difficulty, i) => {
          return (
            <DemoChooseTextCard
              textSelection={difficulty}
              isActiveText={false}
              isTopOfBookshelf={i === 0}
              key={difficulty + i + "bookshelf"}
            />
          );
        })}
      </section>
    </main>
  );
}
export default DemoLibrary;
