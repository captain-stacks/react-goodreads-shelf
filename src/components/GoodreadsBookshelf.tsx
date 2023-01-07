import { FunctionComponent, useState } from "react";
import useGoodreadsShelf from "../hooks/useGoodreadsShelf";
import { BookGroup, Props } from "../types";
import { ALL_GROUP_TITLE } from "../util";
import BookList from "./BookList";
import styles from "./GoodreadsBookshelf.module.css";
import Loader from "./Loader";

/** Display a Goodreads bookshelf component */
const GoodreadsBookshelf: FunctionComponent<Props> = (props) => {
  const { books, loading, error } = useGoodreadsShelf(props);
  const [ excluded, setExcluded ] = useState(props.excludeShelves || [])

  return (
    <div className="rgs-shelf">
      {loading ? (
        <Loader />
      ) : (
        <div>
          {books.filter(b => !excluded.includes(b.title)).map((el) => {
            return (
              <div key={el.title} className={`rgs-group ${styles.group}`}>
                <GroupTitle {...{el, setExcluded}}/>
                <BookList books={el.books} options={props} />
              </div>
            );
          })}
        </div>
      )}

      {error && <div>Sorry, we couldn't load books right now</div>}
    </div>
  );
};

const GroupTitle: FunctionComponent<{el: BookGroup, setExcluded: any}> = ({el, setExcluded}) => {
  return el.title !== ALL_GROUP_TITLE && (
    <div className={`rgs-group-title ${styles.groupTitle}`}
      onMouseOver={() => {
        console.log(el.title)
      }}
      onClick={() => {
        setExcluded(excluded => [...excluded, el.title])
      }}>
      {el.title}{" "}
      <small>
        ({el.books.length} {el.books.length === 1 ? "book" : "books"})
      </small>
    </div>
  );
};

export default GoodreadsBookshelf;
