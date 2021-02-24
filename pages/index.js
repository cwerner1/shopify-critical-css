import { Component } from 'react';
import { 
	Button, 
	Card, 
	Page, 
	Banner,
	List,
	Layout,
	TextStyle,
	TextContainer,
	ProgressBar,
	Heading
} from '@shopify/polaris';


class Index extends Component {
	constructor(props) {
		super(props);
		this.state = {
			action: null,
			status: 'not started',
			progress: 0
		}

		this.showRestoreBanner = this.showRestoreBanner.bind(this);
		this.handleCriticalCssOff = this.handleCriticalCssOff.bind(this);
		this.handleCriticalCssOn = this.handleCriticalCssOn.bind(this);
	}

	async pollJob(jobId, interval, timeout) {
		const intervalId = setInterval(async () => {
			const result = await this.checkJob(jobId);
			this.setState({
				action: result.type, 
				status: result.state,
				progress: result.progress  
			})
			if(result.state === 'completed' || result.state === 'failed') {
				clearInterval(intervalId);
				clearTimeout(timeoutId);
			}
		}, interval);

		const timeoutId = setTimeout(() => {
			clearInterval(intervalId);
			this.setState({ action: 'failed' });
		}, timeout)
	}

	async checkJob(id) {
		const res = await fetch(`/job/${id}`);
		const result = await res.json();
		return result;
	}

	async handleCriticalCssOff() {
		this.setState({ action: 'restore', status: 'active', progress: 0 });
		const res = await fetch('/restore', { method: 'POST' });
		const job = await res.json();
		this.pollJob(job.id, 1000, 5000);
	}

	async handleCriticalCssOn() {
		this.setState({ action: 'generate', status: 'active', progress: 0 });
		const res = await fetch('/generate', { method: 'POST' })
		const job = await res.json();
		this.pollJob(job.id, 2000, 20000);
	}

	showGenerateBanner() {
		if(this.state.action === 'generate') {
			if(this.state.status === 'completed') {
				return (<div className="banner"><Banner status="success" title="Successfully generated critical css!" className="banner"><p>Your site will now load faster for all users</p></Banner></div>);
			}
			else if(this.state.status === 'failed') {
				return (<div className="banner"><Banner status="critical" title="Failed to generate critical css" className="banner"><p>Something went wrong trying to generate the critical css fo your site. Please try again. If this keeps happening, please contact <a href="mailto:alexflorisca@gmail.com">support</a></p></Banner></div>);
			}
			else {
				return (
					<div className="banner">
						<Banner status="info" title="Generating critical css">
							<p>This could take a few minutes, please be patient...</p>
							<ProgressBar progress={this.state.progress} size="small" />
						</Banner>
					</div>);
			}
		}
	}

	showRestoreBanner() {
		if(this.state.action === 'restore') {
			if(this.state.status === 'completed') {
				return (<div className="banner"><Banner status="success" title="Removed critical css and restored theme files.">You can now safely remove the app without affecting your website, or generate the critical CSS again for a faster site</Banner></div>);
			}
			else if(this.state.status === 'failed') {
				return (<div className="banner"><Banner status="warning" title="Couldn't remove critical CSS">
					<p>There was an error while trying to remove the critical css and restore your theme files. You can do this manually if you wish, following these instructions:</p>
					<List>
						<List.Item>Click on <strong>Online Store</strong>, then on <strong>Actions</strong> &gt; <strong>Edit Code</strong> next to your live theme </List.Item>
						<List.Item>In the right hand bar, find <strong>snippets/critical-css.liquid</strong> and delete it</List.Item>
						<List.Item>Find <strong>theme.liquid</strong> and click on it to open.</List.Item>
						<List.Item>Find the line of code that looks like this: <code><strong>&#x7B;&#x25;&#x20;&#x69;&#x6E;&#x63;&#x6C;&#x75;&#x64;&#x65;&#x20;&#x27;&#x63;&#x72;&#x69;&#x74;&#x69;&#x63;&#x61;&#x6C;&#x2D;&#x63;&#x73;&#x73;&#x2E;&#x6C;&#x69;&#x71;&#x75;&#x69;&#x64;&#x27;&#x20;&#x25;&#x7D;</strong></code> and delete it</List.Item>
						<List.Item>Find all the lines starting with <code><strong>&#x3C;&#x6C;&#x69;&#x6E;&#x6B;&#x20;&#x72;&#x65;&#x6C;&#x3D;&#x22;&#x73;&#x74;&#x79;&#x6C;&#x65;&#x73;&#x68;&#x65;&#x65;&#x74;&#x22;</strong></code>. Remove <code><strong>&#x61;&#x73;&#x3D;&#x22;&#x73;&#x74;&#x79;&#x6C;&#x65;&#x22;</strong></code> and <code><strong>&#x6F;&#x6E;&#x6C;&#x6F;&#x61;&#x64;&#x3D;&#x22;&#x74;&#x68;&#x69;&#x73;&#x2E;&#x6F;&#x6E;&#x6C;&#x6F;&#x61;&#x64;&#x3D;&#x6E;&#x75;&#x6C;&#x6C;&#x3B;&#x74;&#x68;&#x69;&#x73;&#x2E;&#x6D;&#x65;&#x64;&#x69;&#x61;&#x3D;&#x27;&#x61;&#x6C;&#x6C;&#x27;&#x22;</strong></code>. Change <code><strong>&#x6D;&#x65;&#x64;&#x69;&#x61;&#x3D;&#x22;&#x6E;&#x6F;&#x6E;&#x65;&#x22;</strong></code> to <code><strong>&#x6D;&#x65;&#x64;&#x69;&#x61;&#x3D;&#x22;&#x61;&#x6C;&#x6C;&#x22;</strong></code></List.Item>
					</List>
					</Banner></div>);
			}
			else {
				return (
					<div className="banner">
						<Banner status="info" title="Restoring critical css">
							<p></p>
							<ProgressBar progress={this.state.progress} size="small" />
						</Banner>
					</div>);
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
				{this.showGenerateBanner()}
				{this.showRestoreBanner()}
				<Layout>
					<Layout.Section oneHalf>
						<Card title="Generate critical CSS" sectioned>
							<TextContainer>
								<p><TextStyle variation="subdued">Generate the styles needed to display the initial screen of your website. You'll need to do this everytime you make a change to the styling of your website, otherwise they will be out of sync</TextStyle></p>
								<p>
									<Button primary onClick={this.handleCriticalCssOn} disabled={generateActive}>
										{generateActive ? 'Generating...' : 'Generate'}
									</Button>
								</p>
							</TextContainer>
						</Card>
					</Layout.Section>
					<Layout.Section oneHalf>
						<Card title="Restore" sectioned>
							<TextContainer>
								<p><TextStyle variation="subdued">Remove critical css from your website. Any changes made to your theme files by this app will be restored. <strong>You should run this before your remove the app</strong></TextStyle></p>
								<p>
									<Button secondary style={{paddingTop: '20px'}} onClick={this.handleCriticalCssOff} disabled={restoreActive}>
										{restoreActive ? 'Restoring...' : 'Restore' }
									</Button>
								</p>
							</TextContainer>
						</Card>
					</Layout.Section>
				</Layout>
				<br />
				<br />
				<Card title="Pricing" sectioned>
					<TextContainer>
						<p>There is a one-off $10 charge for this app. You can run critical-css once and forget about it, unless you make frequent changes to your website design</p>
					</TextContainer>
				</Card>
				<Card title="What is Critical CSS?" sectioned>
					<TextContainer>
						<p>Critical CSS refers to the styles needed to display the initial screen of your website, before the user scrolls down or navigates away from the page. We generate these styles and download them as soon as possible so that users can start interacting with your website faster. The rest of the styles are loaded in the background and are applied when they're ready. This means the website will appear significantly faster to your users.</p>
						<Heading>Lighthouse Performance</Heading>
						<p>This app also has the benefit of potentially improving your Lighthouse performance score. This is a tool used by Shopify and Google to assess the performance of your website. It matters for things like how high you rank in search engines. Google are placing a growing importance on performance for this. You can access the Lighthouse tool in <strong>Google Chrome Developer Tools</strong>, in the <strong>Audit</strong> tab</p>
						<p>You'll often see the following opportunity mentioned in a Lighthouse report. This app aims to address this by generating the critical css</p>
						<p><img class="lighthouse" src="https://shop-critical-css.s3-eu-west-1.amazonaws.com/blocking-resources.png"></img></p>
					</TextContainer>
				</Card>
		</Page>)
	}
}

export default Index;