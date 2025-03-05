import { dataSource } from '@graphprotocol/graph-ts'
import {
    ProjectAdded,
    ProjectContractAdded,
    ProjectContractRemoved,
    ProjectEnabled,
    ProjectSuspended,
} from '../../generated/FeeM/FeeM'

import { getOrCreateFeeM, getOrCreateProject } from '../entities'
import { FeeM } from '../../generated/schema'

export function projectAdded(event: ProjectAdded): void {
    const params = event.params
    const projectId = params.projectId
    const project = getOrCreateProject(projectId.toI32())
    project.enabled = true
    project.activeFromEpoch = params.activeFromEpoch.toI32()
    project.contracts = params.contracts.map<string>((contract) => contract.toHexString())
    project.numberOfContracts = params.contracts.length
    project.save()

    const address = dataSource.address()
    let feem = getOrCreateFeeM(address.toHexString())
    feem.totalContracts = feem.totalContracts + params.contracts.length
    feem.save()
}

export function projectContractAdded(event: ProjectContractAdded): void {
    const params = event.params
    const projectId = params.projectId
    const project = getOrCreateProject(projectId.toI32())
    project.contracts.push(params.contractAddress.toHexString())
    project.numberOfContracts = project.contracts.length
    project.save()

    const address = dataSource.address()
    let feem = getOrCreateFeeM(address.toHexString())
    feem.totalContracts = feem.totalContracts + 1
    feem.save()
}

export function projectContractRemoved(event: ProjectContractRemoved): void {
    const params = event.params
    const projectId = params.projectId
    const project = getOrCreateProject(projectId.toI32())
    const newContracts: string[] = []
    for (let i = 0; i < project.contracts.length; i++) {
        if (project.contracts[i] != params.contractAddress.toHexString()) {
            newContracts.push(project.contracts[i])
        }
    }
    project.contracts = newContracts
    project.numberOfContracts = project.contracts.length
    project.save()

    const address = dataSource.address()
    let feem = getOrCreateFeeM(address.toHexString())
    feem.totalContracts = feem.totalContracts - 1
    feem.save()
}

export function projectEnabled(event: ProjectEnabled): void {
    const params = event.params
    const projectId = params.projectId
    const project = getOrCreateProject(projectId.toI32())
    project.enabled = true
    project.save()
}

export function projectSuspended(event: ProjectSuspended): void {
    const params = event.params
    const projectId = params.projectId
    const project = getOrCreateProject(projectId.toI32())
    project.enabled = false
    project.save()
}
