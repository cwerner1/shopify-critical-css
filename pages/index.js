import { Component } from 'react';
import { EmptyState, Page, Layout } from '@shopify/polaris';
import io from 'socket.io-client';

const img = 'https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg';

class Index extends Component {
	constructor(props) {
		super(props);
	}

	componentDidMount() {
		this.socket = io();
		this.socket.on('critical-css', data => {
			console.log(data);
			// Update some kind of state and then update the UI
		})
	}

	render() {
		return (<Page>
			<Layout>
				<EmptyState 
					heading="Speed up your site with Critical CSS"
					action={{
						content: 'Generate Critical CSS',
						onAction: () => {
							fetch('/generate').then(res => res.json()).then(res => console.log(res));
						}
					}}
					image={img}
				>
				</EmptyState>
			</Layout>
		</Page>)
	}
}

export default Index;