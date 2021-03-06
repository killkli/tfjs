/**
 * @license
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import * as tfc from '@tensorflow/tfjs-core';

import {NamedTensorsMap} from '../../data/types';
import {ExecutionContext} from '../../executor/execution_context';
import {InternalOpAsyncExecutor, Node} from '../types';

import {getParamValue} from './utils';

export const executeOp: InternalOpAsyncExecutor = async(
    node: Node, tensorMap: NamedTensorsMap,
    context: ExecutionContext): Promise<tfc.Tensor[]> => {
  switch (node.op) {
    case 'NonMaxSuppressionV5':
    case 'NonMaxSuppressionV3':
    case 'NonMaxSuppressionV2': {
      const boxes =
          getParamValue('boxes', node, tensorMap, context) as tfc.Tensor;
      const scores =
          getParamValue('scores', node, tensorMap, context) as tfc.Tensor;
      const maxOutputSize =
          getParamValue('maxOutputSize', node, tensorMap, context) as number;
      const iouThreshold =
          getParamValue('iouThreshold', node, tensorMap, context) as number;
      const scoreThreshold =
          getParamValue('scoreThreshold', node, tensorMap, context) as number;

      if (node.op === 'NonMaxSuppressionV5') {
        const softNmsSigma =
            getParamValue('softNmsSigma', node, tensorMap, context) as number;

        const result = await tfc.image.nonMaxSuppressionWithScoreAsync(
            boxes as tfc.Tensor2D, scores as tfc.Tensor1D, maxOutputSize,
            iouThreshold, scoreThreshold, softNmsSigma);

        return [result.selectedIndices, result.selectedScores];
      }

      return [await tfc.image.nonMaxSuppressionAsync(
          boxes as tfc.Tensor2D, scores as tfc.Tensor1D, maxOutputSize,
          iouThreshold, scoreThreshold)];
    }
    case 'Where': {
      const condition =
          (getParamValue('condition', node, tensorMap, context) as tfc.Tensor)
              .asType('bool');
      const result = [await tfc.whereAsync(condition)];
      condition.dispose();
      return result;
    }
    case 'ListDiff': {
      return tfc.setdiff1dAsync(
          getParamValue('x', node, tensorMap, context) as tfc.Tensor,
          getParamValue('y', node, tensorMap, context) as tfc.Tensor);
    }
    default:
      throw TypeError(`Node type ${node.op} is not implemented`);
  }
};

export const CATEGORY = 'dynamic';
