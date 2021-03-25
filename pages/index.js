import { Component } from 'react';
import { withRouter } from 'next/router';
import { getQueryVariable } from '../lib/utils';
import createApp from "@shopify/app-bridge";
import { authenticatedFetch } from '@shopify/app-bridge-utils';
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
	Heading,
	Frame,
	Loading
} from '@shopify/polaris';


class Index extends Component {
	constructor(props) {
		super(props);

		this.showRestoreBanner = this.showRestoreBanner.bind(this);
		this.showError = this.showError.bind(this);
		this.showPaidBanner = this.showPaidBanner.bind(this);
		this.showMainScreen = this.showMainScreen.bind(this);
		this.handleCriticalCssOff = this.handleCriticalCssOff.bind(this);
		this.handleCriticalCssOn = this.handleCriticalCssOn.bind(this);

		const shop = getQueryVariable(props.router.asPath, 'shop');
		const charge_id = getQueryVariable(props.router.asPath, 'charge_id');

		this.state = {
			loading: true,
			action: null,
			status: 'not started',
			progress: 0,
			paid: false,
			error: false,
			shop,
			charge_id
		}
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
		const res = await this.sFetch(`/job/${id}`);
		const result = await res.json();
		return result;
	}

	async handleCriticalCssOff() {
		this.setState({ action: 'restore', status: 'active', progress: 0 });
		const res = await this.sFetch('/restore');
		const job = await res.json();
		if(job.error) {
			this.setState({ action: 'restore', status: 'failed' });
		}
		else {
			this.pollJob(job.id, 1000, 5000);
		}
	}

	async handleCriticalCssOn() {
		this.setState({ action: 'generate', status: 'active', progress: 0 });
		const res = await this.sFetch('/generate')
		const job = await res.json();
		if(job.error) {
			this.setState({ action: 'generate', status: 'failed' });
		}
		else {
			this.pollJob(job.id, 2000, 20000);
		}
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

	showError() {
		if(this.state.error && !this.state.loading) {
			return (
			<div className="banner">
				<Banner status="warning" title="There was an error while loading the app">
					<p>Please log out and back into shopify and try again. If the problem persists, contact <a href="mailto:alexflorisca@gmail.com">support</a></p>
				</Banner>
			</div>)
		}
	}

	showPaidBanner() {
		if(!this.state.paid && !this.state.loading) {
			const authUrl = `/auth?shop=dev-1987.myshopify.com`;
			return (
			<div className="banner">
				<Banner status="warning" title="Have you paid for this app?">
					<p>If you haven't please <a href={authUrl}>pay the $10 one time fee here</a>. If you have paid and are seeing this in error, please contact <a href="mailto:alexflorisca@gmail.com">support</a></p>
				</Banner>
			</div>)
		}
	}

	showLoading() {
		if(this.state.loading) {
			return(
				<div style={{height: '100px'}}>
				  <Frame>
				    <Loading />
				  </Frame>
				</div>
			)
		}
	}


	showMainScreen() {
		const status = this.state.status;
		const action = this.state.action;
		const restoreActive = action === 'restore' && status === 'active';
		const generateActive = action === 'generate' && status === 'active';

		if(!this.state.error && this.state.paid && !this.state.loading) {
			return (<div>
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
							<p><img className="lighthouse" src="https://shop-critical-css.s3-eu-west-1.amazonaws.com/blocking-resources.png"></img></p>
						</TextContainer>
					</Card>
				</div>
			)
		}
	}

	async componentDidMount() {
		let error, paid;
		
		const app = createApp({
			apiKey: "8c7931e855bbc74ebf8468af4b670877",
			shopOrigin: this.state.shop
		});
		this.sFetch = authenticatedFetch(app);

		if(this.state.charge_id) {
			await this.sFetch(`/store-paid?charge_id=${this.state.charge_id}`);
			paid = true;
		}
		else {
			const hasPaid = await this.sFetch('/paid').then(res => res.json());
			if(hasPaid.error) {
				error = true
			}
			else {
				paid = hasPaid.success;
			}
		}

		this.setState({
			paid,
			error,
			loading: false
		})
	}

	render() {
		return (
			<Page fullWidth title="Critical CSS">
				{this.showGenerateBanner()}
				{this.showRestoreBanner()}
				{this.showError()}
				{this.showLoading()}
				{this.showPaidBanner()}
				{this.showMainScreen()}
		</Page>)
	}
}

export default withRouter(Index);