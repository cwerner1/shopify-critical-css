import { EmptyState, Page, Layout, TextStyle } from '@shopify/polaris';

const img = 'https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg';

const Index = () => (
	<Page>
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
				<p>Select some products</p>
			</EmptyState>
		</Layout>
	</Page>
)

export default Index;