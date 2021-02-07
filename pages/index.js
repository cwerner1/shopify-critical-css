import { Component } from 'react';
import { 
	Button, 
	Card, 
	Page, 
	Layout, 
	TextContainer 
} from '@shopify/polaris';

class Index extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (<Page fullWidth>
			<Layout>
				<Layout.Section>
					<Card title="Speed up your site with Critical CSS" sectioned>
						<TextContainer>
							<p>This will speed up your website by generating the styles needed for the initial screen. The stylesheet loads in the background and is applied when it's ready. What this means is that users don't have to wait for styles for the entire website to be downloaded before they can view the page. This speeds up the first view experience significantly, improving user experience and potentially conversions</p>
							<p><Button primary onClick={() => {
								fetch('/generate', { method: 'POST' }).then(res => res.json()).then(res => console.log(res));
							}}>Generate</Button></p>
						</TextContainer>
					</Card>
				</Layout.Section> 
			</Layout>
		</Page>)
	}
}

export default Index;