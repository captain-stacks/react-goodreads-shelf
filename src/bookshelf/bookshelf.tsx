import React from 'react'
import { createRoot } from 'react-dom/client'
import GoodreadsBookshelf from '..'

let id = window.location.hash.substring(1)

createRoot(document.getElementById('home')!).render(
  <div>
    {id && <GoodreadsBookshelf
        userId={id}
        width={120}
        limit={500}
        groupBy='shelf'
        sort='rating'
        displayOptions = {{
            hideBackgroundImages: true,
			hideDetails: {
				subtitle: true,
				author: true,
				title: false
			}
		}}
    />}
  </div>
)