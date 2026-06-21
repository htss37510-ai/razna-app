import dataData from '../../public/data.json';

export const initialDrugs = dataData.catalog || dataData.drugs || [];

export const fetchDrugs = async () => {
    return dataData.catalog || dataData.drugs || [];
};