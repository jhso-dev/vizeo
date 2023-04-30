import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import VizeoWebviewPlayer, { VizeoWebviewPlayerProps } from "./vizeo"

const parseStringToBeBoolean = (value: string | null): boolean | string | null => {
	if (value === "1" || value === "true") {
		return true
	} else if (value === "0" || value === "false") {
		return false
	}

	return value
}

const searchParams = new URLSearchParams(window.location.search)
const searchParamKeys = Array.from(searchParams.keys())
const props = searchParamKeys.reduce((accumulator, key) => {
  accumulator[key] = parseStringToBeBoolean(searchParams.get(key))
  return accumulator
}, {}) as VizeoWebviewPlayerProps

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
)

root.render(
  <React.StrictMode>
    <VizeoWebviewPlayer {...props} />
  </React.StrictMode>
)
