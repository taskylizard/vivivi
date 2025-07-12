import { ErrorBoundary } from 'react-error-boundary'
import { Route, Switch } from 'wouter'
import { FallbackRender } from './components/error-boundary'

import GraphPage from './components/graph-page'
import HomePage from './components/home-page'
import NotFoundPage from './components/not-found-page'

const App: React.FC = () => {
  return (
    <ErrorBoundary fallbackRender={FallbackRender}>
      <Switch>
        <Route path='/' component={HomePage} />
        <Route path='/graph/:graphId'>
          {(params) => <GraphPage params={params} />}
        </Route>
        <Route component={NotFoundPage} />
      </Switch>
    </ErrorBoundary>
  )
}

export default App
