import React, { useCallback, useEffect, useRef, VideoHTMLAttributes } from "react"
import styled from "styled-components"
import VizeoPlayer, { MessageEventType, VideoHandle } from "./player"

export interface VizeoWebviewPlayerProps extends VideoHTMLAttributes<HTMLVideoElement> {
	src: string
}

const VizeoWebviewPlayer = (props: VizeoWebviewPlayerProps) => {
	const messageOriginRef = useRef<string>("*")
	const videoRef = useRef<VideoHandle>(null)

	const handleVideoEvent = useCallback(
		({ type, value }) => {
			try {
				window.parent.postMessage({ type, value }, messageOriginRef.current)
			} catch (e) {
				console.error("Unable to send the message", e)
			}
		},
		[]
	)

	const onMessage = useCallback(
		(message: MessageEvent["data"]) => {
			try {
				if (window === message.source) {
                    return
                }

				if (messageOriginRef.current === "*") {
                    messageOriginRef.current = message.origin
                }

				const { type, value, name } = JSON.parse(message.data) as MessageEventType
				switch (type) {
					case "play":
						videoRef.current?.play()
						break
					case "pause":
						videoRef.current?.pause()
						break
					case "stop":
						videoRef.current?.stop()
						break
					case "mute":
						videoRef.current?.mute()
						break
					case "unMute":
						videoRef.current?.unMute()
						break
					case "getProperty": {
						const propertyValue = videoRef.current?.getProperty(typeof value === "string" ? value : "")
						handleVideoEvent({ type: value, value: propertyValue })
						break
					}
					case "setProperty": {
						if(name && value){
							videoRef.current?.setProperty(name, value)
						}
						break
					}
					default:
						break
				}
			} catch (e) {
				console.error(e)
			}
		},
		[handleVideoEvent]
	)

	useEffect(() => {
		window.addEventListener("message", onMessage)
		return () => window.removeEventListener("message", onMessage)
	}, [onMessage])

	return (
		<>
			<style>{`html, body { background-color: transparent !important }`}</style>
			<VizeoWebviewPlayerContainer
				ref={videoRef}
				handleVideoEvent={handleVideoEvent}
				{...props}
			/>
		</>
	)
}
export default VizeoWebviewPlayer

const VizeoWebviewPlayerContainer = styled(VizeoPlayer)`
	justify-content: center;
	align-items: center;
	display: flex;
	width: 100%;
	height: 100%;
`
