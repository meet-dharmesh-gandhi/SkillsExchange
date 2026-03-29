import { CSSProperties } from "react";
import "./loader.css";

export default function Loader({ len = 3 }: { len?: number }) {
	return (
		<div className="flex">
			{Array(len)
				.fill(0)
				.map((_, ind) => (
					<div
						key={`loader-{${ind}}`}
						className="loader"
						style={
							{
								"--n": ind,
							} as CSSProperties
						}
					></div>
				))}
		</div>
	);
}
