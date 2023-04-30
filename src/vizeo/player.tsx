import React, {
	forwardRef,
	ForwardRefRenderFunction,
	memo,
	useEffect,
	useImperativeHandle,
	useRef,
	VideoHTMLAttributes,
} from "react"
import Hls, { HlsConfig } from "hls.js"
import styled from "styled-components"

export interface MessageEventType {
	type: string
	value?: Record<string, unknown> | string | number | boolean
}
export interface VizeoPlayerProps extends VideoHTMLAttributes<HTMLVideoElement> {
	hlsConfig?: Partial<HlsConfig>
	src: string
	handleVideoEvent: ({ type, value }: MessageEventType) => void
}

export interface VideoHandle {
	stop(): void
	play(): void
	pause(): void
	mute(): void
	unMute(): void
	getProperty(name: string): string | number | boolean | undefined
}

const VIDEO_EVENT_NAMES = [
	"resize",
	"seeking",
	"seeked",
	"canplay",
	"loadedmetadata",
	"loadeddata",
	"loadstart",
	"load",
	"durationchange",
	"volumechange",
	"play",
	"error",
	"pause",
	"canplaythrough",
	"ended",
	"playing",
	"timeupdate",
]

const VizeoPlayer: ForwardRefRenderFunction<VideoHandle, VizeoPlayerProps> = (props, ref) => {
	const { src, autoPlay, hlsConfig, handleVideoEvent } = props
	const videoRef = useRef<HTMLVideoElement>()

	useImperativeHandle(
		ref,
		() => ({
			stop: () => {
				if (videoRef.current) {
					videoRef.current.pause()
					videoRef.current.currentTime = 0.001
				}
			},
			play: () => {
				videoRef.current?.play().catch(() => {
					console.error("Unable to autoplay prior to user interaction with the dom.")
				})
			},
			pause: () => {
				videoRef.current?.pause()
			},
			mute: () => {
				if (videoRef.current?.muted === false) {
					videoRef.current.muted = true
				}
			},
			unMute: () => {
				if (videoRef.current?.muted === true) {
					videoRef.current.muted = false
				}
			},
			getProperty: (name: string): string | number | boolean | undefined => {
				if (videoRef.current && videoRef.current[name]) {
					const val = videoRef.current[name]
					if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
						return val
					}
				}

				return undefined
			},
		}),
		[src]
	)
	useEffect(() => {
		const video = videoRef.current

		if (video) {
			VIDEO_EVENT_NAMES.forEach((eventName) => {
				video.addEventListener(eventName, handleVideoEvent)
			})
		}

		return () => {
			if (video) {
				VIDEO_EVENT_NAMES.forEach((eventName) => {
					video.removeEventListener(eventName, handleVideoEvent)
				})
			}
		}
	}, [handleVideoEvent])

	useEffect(() => {
		let hls: Hls
		const video = videoRef.current

		// Check if the streaming file is mp4.
		const isMp4 = src.split(".").pop() === "mp4"

		if (video) {
			// hls is not supported with mp4.
			if (isMp4 || video.canPlayType("application/vnd.apple.mpegurl")) {
				// for preload video.
				// https://muffinman.io/blog/hack-for-ios-safari-to-display-html-video-thumbnail/
				video.src = `${src}#t=0.001`
				video.preload = "auto"
			} else if (Hls.isSupported()) {
				hls = new Hls(hlsConfig)
				hls.attachMedia(video)
				hls.loadSource(src)
				hls.on(Hls.Events.MANIFEST_PARSED, () => {
					if (autoPlay) {
						video.play().catch(() => {
							console.error("Unable to autoplay prior to user interaction with the dom.")
						})
					}
				})

				hls.on(Hls.Events.ERROR, (message) => {
					console.error(message)
				})
			} else {
				console.error("HLS is not supported on your browser.")
			}
		}

		return () => {
			if (video) {
				video.pause()
				video.removeAttribute("src")
				video.load()
			}

			hls?.destroy()
		}
	}, [])

	return (
		<Video
			ref={videoRef}
			// eslint-disable-next-line react/jsx-props-no-spreading
			{...props}
			crossorigin={props.crossOrigin || "anonymous"}
			controlsList={props.controlsList || "nodownload"}
		/>
	)
}

export default memo(forwardRef(VizeoPlayer))

const Video = styled.video`
	position: absolute;
	width: 100%;
	height: 100%;
	object-position: center;
	object-fit: contain;
	width: 100%;
	height: 100%;
`
