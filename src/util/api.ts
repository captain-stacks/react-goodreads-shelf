import { Book, BookGroup, FetchResults, Props, Status } from "../types";
import { getUrl } from "./get-url";
import { getBooksFromHtml } from "./html-utils";

const GOODREADS_PAGE_SIZE = 30;

export const ALL_GROUP_TITLE = "All";

export const fetchAllBooks = async (props: Props): Promise<BookGroup[]> => {
  let books: Book[] = [];
  const groupByShelf = props.groupBy == "shelf";
  const shelves = groupByShelf ? await getAllShelves(props) : [props.shelf];
  
  for (const shelf of shelves) {
    // Get first page
    const firstPage = await fetchPage(1, props, shelf);
    const maxBooks = Math.min(props.limit ?? 10, firstPage.status.total);
    const maxPages = Math.ceil(maxBooks / GOODREADS_PAGE_SIZE);
    const promises: Promise<FetchResults>[] = [];

    for (let i = 2; i <= maxPages; i++) {
      promises.push(fetchPage(i, props, shelf));
    }

    const data = await Promise.all(promises);

    data.sort((a, b) => {
      return a.status.end - b.status.end;
    });

    let currentBooks = data.reduce((prev, cur) => {
      return prev.concat(cur.books);
    }, firstPage.books);

    for (const book of currentBooks) {
      book.shelf = shelf;
      books.push(book);
    }
  }

  // Optionally filter the books
  if (props.filter) {
    books = books.filter(props.filter);
  }

  if (props.limit) {
    books = books.slice(0, props.limit);
  }

  if (props.groupBy) {
    const grouped = books.reduce((prev: { [key: string]: Book[] }, cur: Book) => {
      const key = groupByShelf ? cur.shelf!
        : String((cur.dateRead || cur.dateAdded)?.getFullYear());
      prev[key] = prev[key] || [];
      prev[key].push(cur);
      return prev;
    }, {});

    const groups: BookGroup[] = [];
    for (const key in grouped) {
      groups.push({
        title: key,
        books: grouped[key]
      });
    }
    groups.sort((a, b) => {
      return Number(b.title) - Number(a.title);
    });
    return groups;
  } else {
    return [
      {
        title: ALL_GROUP_TITLE,
        books
      }
    ];
  }
};

const fetchPage = async (page: number, props: Props, shelf?: string): Promise<FetchResults> => {
  // Get the books from Goodreads
  const url = getUrl(props, page, shelf);
  url.searchParams.append("page", String(page));
  const response = await window.fetch(url.toString(), { headers: { accept: "text/javascript" } });

  // Simulate success if we get a 204 No Content response
  if (response.status === 204) {
    return {
      books: [],
      status: {
        end: page * 30,
        total: 0
      }
    };
  }

  const responseBody = await response.text();
  const { html, status } = parseJsonP(responseBody);
  const table = `<table>${html}</table>`;
  const books = getBooksFromHtml(table, props.width);
  return {
    books,
    status
  };
};

const parseJsonP = (jsonp: string): { html: string; status: Status } => {
  const [html, status] = jsonp.split("\n");

  // eslint-disable-next-line quotes
  const json = html.replace('Element.insert("booksBody", ', "").replace(" });", "}").replace("bottom", '"bottom"');
  const output: string = JSON.parse(json).bottom;

  const matches = status.match(/(?<end>\d*) of (?<total>\d*) loaded/);
  return {
    html: output,
    status: {
      end: parseInt(matches?.groups?.end ?? "0"),
      total: parseInt(matches?.groups?.total ?? "0")
    }
  };
};

const getAllShelves = async (props: Props): Promise<string[]> => {
  const url = 'https://www.goodreads.com/review/list/' + props.userId
  const proxyUrl = `https://cors.kylekarpack.workers.dev/corsproxy/?apiurl=${encodeURIComponent(url)}`
  const text = await fetch(proxyUrl).then(res => res.text())
  const goodreadsDocument = new DOMParser().parseFromString(text, "text/html")
  return [...goodreadsDocument.querySelectorAll('.userShelf')].map(e =>
      e.querySelector('.actionLinkLite')!.getAttribute('href')!.match(/shelf=(.+)/)![1])
};
