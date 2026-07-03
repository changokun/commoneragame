import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ErrorModalConfig, ModalAction } from ".";


export function ErrorModalDialog(config: ErrorModalConfig) {
	console.log('inemc', config)
	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<Card className="max-w-md mx-4 p-6">
				<h3 className="font-bold text-lg mb-4">{config.title}</h3>
				<p className="text-sm text-muted-foreground mb-6">{config.message}</p>
				<div className="flex gap-3 justify-end">


					{config.userMust?.map((action: ModalAction, index: number) => (
						<Button
							key={`must-${index}`}
							variant={action.variant || "default"}
							className="bg-destructive"
							onClick={() => {
								if(action.method) action.method();
								config.close();
							}}
							>
							MUST: {action.text}
						</Button>
					))}

					<hr />

					{ ! config.userMust.length && config.userMay?.map((action: ModalAction, index: number) => (
						<Button
						key={index}
						variant={action.variant || "default"}
						onClick={() => {
								if(action.method) {
									action.method();
								} else if (action.text.indexOf('ancel') !== -1) {
									// do nothing but close.
								}
								config.close();
							}}
						>
							MAY: {action.text}
						</Button>
					))}

				</div>
			</Card>
		</div>
	)
}

