'use strict';

const { Contract } = require('fabric-contract-api');

class HerbionYXContract extends Contract {

    // Initialize the ledger
    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        
        // Initialize with some sample data if needed
        const batches = [];
        
        for (let i = 0; i < batches.length; i++) {
            await ctx.stub.putState('BATCH' + i, Buffer.from(JSON.stringify(batches[i])));
            console.info('Added batch:', batches[i]);
        }
        
        console.info('============= END : Initialize Ledger ===========');
    }

    // Create a new collection event (herb collection)
    async createCollectionEvent(ctx, batchId, herbSpecies, collectorName, weight, harvestDate, location, qualityGrade, notes, ipfsHash, qrCodeHash) {
        console.info('============= START : Create Collection Event ===========');

        const collectionEvent = {
            docType: 'collectionEvent',
            batchId: batchId,
            eventId: `COLLECTION-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            herbSpecies: herbSpecies,
            collectorName: collectorName,
            weight: parseFloat(weight),
            harvestDate: harvestDate,
            location: JSON.parse(location),
            qualityGrade: qualityGrade,
            notes: notes,
            ipfsHash: ipfsHash,
            qrCodeHash: qrCodeHash,
            timestamp: new Date().toISOString(),
            eventType: 'COLLECTION'
        };

        // Store the collection event
        await ctx.stub.putState(collectionEvent.eventId, Buffer.from(JSON.stringify(collectionEvent)));

        // Create or update batch record
        let batch;
        const batchAsBytes = await ctx.stub.getState(batchId);
        
        if (!batchAsBytes || batchAsBytes.length === 0) {
            // Create new batch
            batch = {
                docType: 'batch',
                batchId: batchId,
                herbSpecies: herbSpecies,
                creator: collectorName,
                creationTime: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                events: [collectionEvent.eventId],
                currentStatus: 'COLLECTED'
            };
        } else {
            // Update existing batch
            batch = JSON.parse(batchAsBytes.toString());
            batch.events.push(collectionEvent.eventId);
            batch.lastUpdated = new Date().toISOString();
        }

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));

        console.info('============= END : Create Collection Event ===========');
        return JSON.stringify(collectionEvent);
    }

    // Create a quality test event
    async createQualityTestEvent(ctx, batchId, parentEventId, testerName, moistureContent, purity, pesticideLevel, testMethod, notes, ipfsHash, qrCodeHash) {
        console.info('============= START : Create Quality Test Event ===========');

        const qualityTestEvent = {
            docType: 'qualityTestEvent',
            batchId: batchId,
            eventId: `QUALITY-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            parentEventId: parentEventId,
            testerName: testerName,
            testResults: {
                moistureContent: parseFloat(moistureContent),
                purity: parseFloat(purity),
                pesticideLevel: parseFloat(pesticideLevel)
            },
            testMethod: testMethod,
            notes: notes,
            ipfsHash: ipfsHash,
            qrCodeHash: qrCodeHash,
            timestamp: new Date().toISOString(),
            eventType: 'QUALITY_TEST'
        };

        // Store the quality test event
        await ctx.stub.putState(qualityTestEvent.eventId, Buffer.from(JSON.stringify(qualityTestEvent)));

        // Update batch record
        const batchAsBytes = await ctx.stub.getState(batchId);
        if (!batchAsBytes || batchAsBytes.length === 0) {
            throw new Error(`Batch ${batchId} does not exist`);
        }

        const batch = JSON.parse(batchAsBytes.toString());
        batch.events.push(qualityTestEvent.eventId);
        batch.lastUpdated = new Date().toISOString();
        batch.currentStatus = 'QUALITY_TESTED';

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));

        console.info('============= END : Create Quality Test Event ===========');
        return JSON.stringify(qualityTestEvent);
    }

    // Create a processing event
    async createProcessingEvent(ctx, batchId, parentEventId, processorName, method, temperature, duration, yieldAmount, notes, ipfsHash, qrCodeHash) {
        console.info('============= START : Create Processing Event ===========');

        const processingEvent = {
            docType: 'processingEvent',
            batchId: batchId,
            eventId: `PROCESSING-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            parentEventId: parentEventId,
            processorName: processorName,
            processingDetails: {
                method: method,
                temperature: temperature ? parseFloat(temperature) : null,
                duration: duration,
                yield: parseFloat(yieldAmount)
            },
            notes: notes,
            ipfsHash: ipfsHash,
            qrCodeHash: qrCodeHash,
            timestamp: new Date().toISOString(),
            eventType: 'PROCESSING'
        };

        // Store the processing event
        await ctx.stub.putState(processingEvent.eventId, Buffer.from(JSON.stringify(processingEvent)));

        // Update batch record
        const batchAsBytes = await ctx.stub.getState(batchId);
        if (!batchAsBytes || batchAsBytes.length === 0) {
            throw new Error(`Batch ${batchId} does not exist`);
        }

        const batch = JSON.parse(batchAsBytes.toString());
        batch.events.push(processingEvent.eventId);
        batch.lastUpdated = new Date().toISOString();
        batch.currentStatus = 'PROCESSED';

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));

        console.info('============= END : Create Processing Event ===========');
        return JSON.stringify(processingEvent);
    }

    // Create a manufacturing/formulation event
    async createManufacturingEvent(ctx, batchId, parentEventId, manufacturerName, productName, productType, quantity, unit, expiryDate, notes, ipfsHash, qrCodeHash) {
        console.info('============= START : Create Manufacturing Event ===========');

        const manufacturingEvent = {
            docType: 'manufacturingEvent',
            batchId: batchId,
            eventId: `MANUFACTURING-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            parentEventId: parentEventId,
            manufacturerName: manufacturerName,
            productDetails: {
                productName: productName,
                productType: productType,
                quantity: parseFloat(quantity),
                unit: unit,
                expiryDate: expiryDate
            },
            notes: notes,
            ipfsHash: ipfsHash,
            qrCodeHash: qrCodeHash,
            timestamp: new Date().toISOString(),
            eventType: 'MANUFACTURING'
        };

        // Store the manufacturing event
        await ctx.stub.putState(manufacturingEvent.eventId, Buffer.from(JSON.stringify(manufacturingEvent)));

        // Update batch record
        const batchAsBytes = await ctx.stub.getState(batchId);
        if (!batchAsBytes || batchAsBytes.length === 0) {
            throw new Error(`Batch ${batchId} does not exist`);
        }

        const batch = JSON.parse(batchAsBytes.toString());
        batch.events.push(manufacturingEvent.eventId);
        batch.lastUpdated = new Date().toISOString();
        batch.currentStatus = 'MANUFACTURED';

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));

        console.info('============= END : Create Manufacturing Event ===========');
        return JSON.stringify(manufacturingEvent);
    }

    // Query a batch by ID
    async queryBatch(ctx, batchId) {
        const batchAsBytes = await ctx.stub.getState(batchId);
        if (!batchAsBytes || batchAsBytes.length === 0) {
            throw new Error(`Batch ${batchId} does not exist`);
        }
        return batchAsBytes.toString();
    }

    // Query an event by ID
    async queryEvent(ctx, eventId) {
        const eventAsBytes = await ctx.stub.getState(eventId);
        if (!eventAsBytes || eventAsBytes.length === 0) {
            throw new Error(`Event ${eventId} does not exist`);
        }
        return eventAsBytes.toString();
    }

    // Get all events for a batch
    async getBatchEvents(ctx, batchId) {
        const batchAsBytes = await ctx.stub.getState(batchId);
        if (!batchAsBytes || batchAsBytes.length === 0) {
            throw new Error(`Batch ${batchId} does not exist`);
        }

        const batch = JSON.parse(batchAsBytes.toString());
        const events = [];

        for (const eventId of batch.events) {
            const eventAsBytes = await ctx.stub.getState(eventId);
            if (eventAsBytes && eventAsBytes.length > 0) {
                events.push(JSON.parse(eventAsBytes.toString()));
            }
        }

        return JSON.stringify(events);
    }

    // Get all batches
    async getAllBatches(ctx) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const allResults = [];

        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }

                if (Record.docType === 'batch') {
                    allResults.push({ Key, Record });
                }
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }

    // Query batch history
    async getBatchHistory(ctx, batchId) {
        const iterator = await ctx.stub.getHistoryForKey(batchId);
        const allResults = [];

        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                const obj = JSON.parse(res.value.value.toString('utf8'));
                allResults.push({
                    txId: res.value.tx_id,
                    timestamp: res.value.timestamp,
                    isDelete: res.value.is_delete.toString(),
                    value: obj
                });
            }
            if (res.done) {
                await iterator.close();
                return JSON.stringify(allResults);
            }
        }
    }

    // Rich query using CouchDB (if available)
    async queryBatchesByHerbSpecies(ctx, herbSpecies) {
        const queryString = {
            selector: {
                docType: 'batch',
                herbSpecies: herbSpecies
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const allResults = [];

        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }
}

module.exports = HerbionYXContract;