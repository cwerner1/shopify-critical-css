import { Component } from 'react';
import { 
	Button, 
	Card, 
	Page, 
	Banner,
	List,
	TextStyle,
	TextContainer
} from '@shopify/polaris';


class Index extends Component {
	constructor(props) {
		super(props);
		this.state = {
			action: null,
			status: 'not started'
		}

		this.showRestoreBanner = this.showRestoreBanner.bind(this);
		this.handleCriticalCssOff = this.handleCriticalCssOff.bind(this);
		this.handleCriticalCssOn = this.handleCriticalCssOn.bind(this);
	}

	async pollJob(jobId, interval, timeout) {
		const intervalId = setInterval(async () => {
			const result = await this.checkJob(jobId);
			this.setState({ action: result.type, status: result.state })
			if(result.state !== 'active') {
				clearInterval(intervalId);
				clearTimeout(timeoutId);
			}
		}, interval);

		const timeoutId = setTimeout(() => {
			clearInterval(intervalId);
		}, timeout)
	}

	async checkJob(id) {
		const res = await fetch(`/job/${id}`);
		const result = await res.json();
		console.log(result);
		return result;
	}

	async handleCriticalCssOff() {
		this.setState({ action: 'restore', status: 'active' });
		const res = await fetch('/restore', { method: 'POST' });
		const job = await res.json();
		console.log('Called /restore with response, ', job);
		this.pollJob(job.id, 1000, 5000);
	}

	async handleCriticalCssOn() {
		this.setState({ action: 'generate', status: 'active' });
		const res = await fetch('/generate', { method: 'POST' })
		const job = await res.json();
		console.log('Called /generate with response, ', job);
		this.pollJob(job.id, 2000, 20000);
	}

	showGenerateBanner() {
		if(this.state.action === 'generate') {
			if(this.state.status === 'completed') {
				return (<Banner status="success" title="Successfully generated critical css!">Your site will now load faster for all users</Banner>);
			}
			if(this.state.status === 'failed') {
				return (<Banner status="critical" title="Failed to generate critical css">Something went wrong trying to generate the critical css fo your site. Please contact <a href="mailto:alexflorisca@gmail.com">support</a></Banner>);
			}
		}
	}

	showRestoreBanner() {
		if(this.state.action === 'restore') {
			if(this.state.status === 'completed') {
				return (<Banner status="success" title="Removed critical css and restored theme files.">You can now safely remove the app without affecting your website, or generate the critical CSS again for a faster site</Banner>);
			}
			if(this.state.status === 'failed') {
				return (<Banner status="warning" title="Couldn't remove critical CSS">
					<p>There was an error while trying to remove the critical css and restore your theme files. You can do this manually if you wish, it only takes a second</p>
					<List>
						<List.Item>Click on <strong>Online Store</strong>, then on <strong>Actions</strong> &gt; <strong>Edit Code</strong> next to your live theme </List.Item>
						<List.Item>In the right hand bar, find <strong>snippets/critical-css.liquid</strong> and delete it</List.Item>
						<List.Item>Find <strong>theme.liquid</strong> and click on it to open.</List.Item>
						<List.Item>Find the line of code that looks like this: <code>&#x7B;&#x25;&#x20;&#x69;&#x6E;&#x63;&#x6C;&#x75;&#x64;&#x65;&#x20;&#x27;&#x63;&#x72;&#x69;&#x74;&#x69;&#x63;&#x61;&#x6C;&#x2D;&#x63;&#x73;&#x73;&#x2E;&#x6C;&#x69;&#x71;&#x75;&#x69;&#x64;&#x27;&#x20;&#x25;&#x7D;</code> and delete it</List.Item>
					</List>
					</Banner>);
			}
		}
	}

	render() {
		const status = this.state.status;
		const action = this.state.action;
		const restoreActive = action === 'restore' && status === 'active';
		const generateActive = action === 'generate' && status === 'active';
		return (
			<Page fullWidth title="Critical CSS">
				<Card title="Generate critical CSS" sectioned>
					<TextContainer>
						{this.showGenerateBanner()}
						<p><TextStyle variation="subdued">Speed up your website by generating the styles needed for the initial screen. The stylesheet loads in the background and is applied when it's ready. What this means is that users don't have to wait for styles for the entire website to be downloaded before they can view the page. This speeds up the first view experience significantly, improving user experience and conversions</TextStyle></p>
						<p>
							<Button primary onClick={this.handleCriticalCssOn} disabled={generateActive}>
								{generateActive ? 'Generating...this may take a few minutes' : 'Generate'}
							</Button>
						</p>
					</TextContainer>
				</Card>
				<Card title="Restore" sectioned>
					<TextContainer>
						{this.showRestoreBanner()}
						<p><TextStyle variation="subdued">Restore any changes made to your theme files by this app</TextStyle></p>
						<p>
							<Button secondary style={{paddingTop: '20px'}} onClick={this.handleCriticalCssOff} disabled={restoreActive}>
								{restoreActive ? 'Restoring...' : 'Restore' }
							</Button>
						</p>
					</TextContainer>
				</Card>
		</Page>)
	}
}

export default Index;