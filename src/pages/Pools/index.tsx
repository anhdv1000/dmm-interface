import React, { useState, useCallback } from 'react'
import { Link, RouteComponentProps } from 'react-router-dom'
import styled from 'styled-components'
import { Box, Flex } from 'rebass'
import { useTranslation } from 'react-i18next'

import { Currency } from 'libs/sdk/src'
import { ButtonOutlined } from 'components/Button'
import PoolsCurrencyInputPanel from 'components/PoolsCurrencyInputPanel'
import Panel from 'components/Panel'
import PoolList from 'components/PoolList'
import Search from 'components/Search'
import LocalLoader from 'components/LocalLoader'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { useDerivedPairInfo, usePairActionHandlers } from 'state/pair/hooks'
import { useSubgraphPoolsData, useUserLiquidityPositions } from 'state/pool/hooks'
import { Field } from 'state/pair/actions'
import { currencyId } from 'utils/currencyId'
import { wrappedCurrency } from 'utils/wrappedCurrency'

const PageWrapper = styled.div`
  padding: 0 10em;
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0 4em;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 0;
  `};
`

const ToolbarWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
`

const CurrencyWrapper = styled(Flex)`
  align-items: center;
`

const SearchWrapper = styled(Flex)`
  align-items: center;
`

const SelectPairInstructionWrapper = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 24px;
`

const Pools = ({
  match: {
    params: { currencyIdA, currencyIdB }
  },
  history
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) => {
  const { t } = useTranslation()
  const { account, chainId } = useActiveWeb3React()
  const [searchValue, setSearchValue] = useState('')

  // Pool selection
  const { onCurrencySelection } = usePairActionHandlers()
  // const {
  //   [Field.CURRENCY_A]: { currencyId: currencyIdA },
  //   [Field.CURRENCY_B]: { currencyId: currencyIdB }
  // } = usePairState()

  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  const { currencies, pairs } = useDerivedPairInfo(currencyA ?? undefined, currencyB ?? undefined)
  const { loading: loadingSubgraphPoolsData, data: subgraphPoolsData } = useSubgraphPoolsData(
    wrappedCurrency(currencyA ?? undefined, chainId),
    wrappedCurrency(currencyB ?? undefined, chainId)
  )

  const { loading: loadingUserLiquidityPositions, data: userLiquidityPositions } = useUserLiquidityPositions(account)

  const handleCurrencyASelect = useCallback(
    (currencyA: Currency) => {
      const newCurrencyIdA = currencyId(currencyA)
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/pools/${currencyIdB}/${currencyIdA}`)
      } else {
        history.push(`/pools/${newCurrencyIdA}/${currencyIdB}`)
      }
    },
    [currencyIdB, history, currencyIdA]
  )
  const handleCurrencyBSelect = useCallback(
    (currencyB: Currency) => {
      const newCurrencyIdB = currencyId(currencyB)
      if (currencyIdA === newCurrencyIdB) {
        if (currencyIdB) {
          history.push(`/pools/${currencyIdB}/${newCurrencyIdB}`)
        } else {
          history.push(`/pools/${newCurrencyIdB}`)
        }
      } else {
        history.push(`/pools/${currencyIdA ? currencyIdA : 'ETH'}/${newCurrencyIdB}`)
      }
    },
    [currencyIdA, history, currencyIdB]
  )

  const poolsList = pairs
    .map(([pairState, pair]) => pair)
    .filter(pair => pair !== null)
    .filter(pair => {
      if (searchValue) {
        return pair?.address.includes(searchValue)
      }

      return true
    })

  return (
    <>
      <PageWrapper>
        <div style={{ marginBottom: '16px' }}>{t('selectPair')}</div>
        <ToolbarWrapper>
          <CurrencyWrapper>
            <PoolsCurrencyInputPanel
              onCurrencySelect={handleCurrencyASelect}
              currency={currencies[Field.CURRENCY_A]}
              id="input-tokena"
            />
            <span style={{ margin: '0 8px' }}>/</span>
            <PoolsCurrencyInputPanel
              onCurrencySelect={handleCurrencyBSelect}
              currency={currencies[Field.CURRENCY_B]}
              id="input-tokenb"
            />
          </CurrencyWrapper>
          <SearchWrapper>
            <Search searchValue={searchValue} setSearchValue={setSearchValue} />
            <ButtonOutlined
              width="148px"
              padding="12px 18px"
              as={Link}
              to={`/create/${currencyIdA == '' ? undefined : currencyIdA}/${
                currencyIdB == '' ? undefined : currencyIdB
              }`}
              style={{ float: 'right' }}
            >
              {t('createNewPool')}
            </ButtonOutlined>
          </SearchWrapper>
        </ToolbarWrapper>

        <Panel>
          {loadingSubgraphPoolsData || loadingUserLiquidityPositions ? (
            <LocalLoader />
          ) : poolsList.length > 0 && subgraphPoolsData?.pools && userLiquidityPositions?.liquidityPositionSnapshots ? (
            <PoolList
              poolsList={poolsList}
              subgraphPoolsData={subgraphPoolsData.pools}
              userLiquidityPositions={userLiquidityPositions.liquidityPositionSnapshots}
              maxItems={50}
            />
          ) : (
            <SelectPairInstructionWrapper>{t('thereAreNoPools')}</SelectPairInstructionWrapper>
          )}
        </Panel>
      </PageWrapper>
    </>
  )
}

export default Pools