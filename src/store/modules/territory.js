import axios from 'axios';

const CHANGE_STATUS = 'CHANGE_STATUS';
const GET_TERRITORY_SUCCESS = 'GET_TERRITORY_SUCCESS';
const GET_TERRITORY_FAIL = 'GET_TERRITORY_FAIL';
const RESET_TERRITORY = 'RESET_TERRITORY';

export const territory = {
  namespaced: true,
  state: {
    territory: {},
  },

  getters: {
    territory: state => {
      return state.territory;
    },
    congId: state => {
      return state.territory.congregationid;
    },
    isCheckedOut: state => {
      return state.territory && state.territory.status && state.territory.status.status === 'Checked Out';
    },
    isOwnedByUser: (state, getters, rootState, rootGetters) => {
      const user = rootGetters['auth/user'];

      if (user) {
        const owner = state.territory && state.territory.status && state.territory.status.publisher;
        return owner && user.username === owner.username;
      }

      return false;
    },
  },

  mutations: {
    CHANGE_STATUS(state, newStatus) {
      state.territory.status = newStatus;
    },
    GET_TERRITORY_SUCCESS(state, territory) {
      state.territory = territory;
    },
    GET_TERRITORY_FAIL(state, exception) { /* eslint-disable-line no-unused-vars */
      // console.log(GET_TERRITORY_FAIL, exception);
    },
    RESET_TERRITORY(state) {
      state.territory = {};
    }
  },

  actions: {
    async checkinTerritory({ commit }, args) {
      try {
        if (!args) {
          throw new Error('Unable to check in territory because the required arguments were not provided');
        }

        const response = await axios({
          data: {
            query: `mutation CheckinTerritory($terrId: Int!, $pubId: Int!, $user: String) { 
              checkinTerritory(territoryId: $terrId, publisherId: $pubId, user: $user) { 
                status {
                  checkout_id
                  status
                  date
                }
              }
            }`,
            variables: {
              terrId: args.territoryId,
              pubId: args.userId,
              user: args.username,
            }
          }
        });

        if (response && response.data && response.data.data) {
          const { status } = response.data.data;
          commit(CHANGE_STATUS, status);
        }

      } catch (e) {
        console.error('Unable to check in territory', e);
      }
    },

    async checkoutTerritory({ commit }, args) {
      try {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            query: `mutation CheckoutTerritory($terrId: Int!, $pubId: Int!, $user: String) { 
              checkoutTerritory(territoryId: $terrId, publisherId: $pubId, user: $user) { 
                status {
                  checkout_id
                  status
                  date
                }
              }
            }`,
            variables: {
              terrId: args.territoryId,
              pubId: args.userId,
              user: args.username,
            }
          }
        });

        if (response && response.data && response.data.data) {
          const { status } = response.data.data;
          commit(CHANGE_STATUS, status);
        }

      } catch (e) {
        console.error('Unable to checkout territory', e);
      }
    },

    async getTerritory({ commit }, id) {
      try {
        const response = await axios({
          url: process.env.VUE_APP_ROOT_API,
          method: 'post',
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            query: `query Territory($terrId: Int) { 
              territory (id: $terrId) {
                group_code id congregationid name description type 
                addresses {
                  id addr1 addr2 city state_province postal_code
                  phone longitude latitude notes
                  activityLogs {
                    id checkout_id address_id value tz_offset
                    timestamp timezone publisher_id notes
                  }
                }
                status {
                  checkout_id
                  status
                  date
                  publisher {
                    id username firstname lastname
                  }
                }
              }
            }`,
            variables: {
              terrId: id,
            }
          }
        });

        if (!response || !response.data || !response.data.data || !response.data.data.territory) {
          return null;
        }        
        const territory = response.data.data.territory;
        commit(GET_TERRITORY_SUCCESS, territory);

      } catch (exception) {
        commit(GET_TERRITORY_FAIL, exception);
      }
    },

    resetTerritory({ commit }) {
      commit(RESET_TERRITORY);
    }
  }
}

